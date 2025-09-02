import json
import psycopg2

# --- CONFIGURAÇÃO ---
# 1. COLE A SUA CONNECTION STRING DO NEON AQUI
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_0Vuh8KIAdvBM@ep-little-scene-ae6jl0i4-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# 2. O nome do seu arquivo JSON local
JSON_FILE_PATH = "compromissos.json"

def migrar_dados():
    print("Iniciando script de migração para o Neon DB...")

    # --- 1. LER OS DADOS DO ARQUIVO JSON LOCAL ---
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            compromissos = json.load(f)
        print(f"Sucesso! Encontrados {len(compromissos)} compromissos no arquivo '{JSON_FILE_PATH}'.")
    except FileNotFoundError:
        print(f"ERRO: O arquivo '{JSON_FILE_PATH}' não foi encontrado.")
        return
    except json.JSONDecodeError:
        print(f"ERRO: O arquivo '{JSON_FILE_PATH}' não é um JSON válido.")
        return

    # --- 2. PREPARAR OS DADOS PARA INSERÇÃO ---
    # Transforma a lista de dicionários em uma lista de tuplas, na ordem correta das colunas
    dados_para_inserir = []
    for comp in compromissos:
        # Importante: se 'dataFim' for uma string vazia, convertemos para None (que vira NULL no SQL)
        data_fim = comp.get('dataFim') if comp.get('dataFim') else None
        
        dados_para_inserir.append((
            comp.get('id'),
            comp.get('titulo'),
            comp.get('dataInicio'),
            data_fim,
            comp.get('recorrencia'),
            comp.get('descricao'),
            comp.get('participantes', []) # Usa uma lista vazia como padrão
        ))

    # --- 3. CONECTAR AO NEON E INSERIR OS DADOS ---
    conn = None
    try:
        print("Conectando ao banco de dados Neon...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()
        print("Conexão bem-sucedida!")

        # O comando SQL para inserir os dados. As colunas devem estar na mesma ordem da tupla acima.
        # ATENÇÃO: Se você nomeou suas colunas de forma diferente no Neon, ajuste aqui.
        sql = """
            INSERT INTO compromissos (id, titulo, "dataInicio", "dataFim", recorrencia, descricao, participantes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
        """
        # "ON CONFLICT (id) DO NOTHING" é uma salvaguarda: se um compromisso com o mesmo ID já existir, ele não faz nada.

        print(f"Inserindo/Atualizando {len(dados_para_inserir)} registros no Neon. Isso pode levar um momento...")
        
        # executemany é MUITO mais rápido para inserir múltiplos registros
        cursor.executemany(sql, dados_para_inserir)
        
        # Efetiva a transação
        conn.commit()
        
        print(f"🎉 Migração concluída! {cursor.rowcount} registros foram afetados no banco de dados.")

    except psycopg2.Error as e:
        print(f"ERRO de banco de dados: {e}")
        if conn:
            conn.rollback() # Desfaz a transação em caso de erro
    finally:
        if conn:
            cursor.close()
            conn.close()
            print("Conexão com o banco de dados fechada.")

# Executa a função principal
if __name__ == '__main__':
    migrar_dados()