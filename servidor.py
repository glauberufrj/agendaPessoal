import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Inicializa a aplicação Flask
app = Flask(__name__)
# Aplica o CORS para permitir requisições do front-end
CORS(app)

# Define o nome do nosso arquivo de "banco de dados"
COMPROMISSOS_FILE = 'compromissos.json'

def ler_compromissos():
    """Função auxiliar para ler os dados do arquivo JSON."""
    try:
        with open(COMPROMISSOS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Se o arquivo não existe ou está vazio/corrompido, retorna uma lista vazia
        return []

def salvar_compromissos(compromissos):
    """Função auxiliar para salvar os dados no arquivo JSON."""
    with open(COMPROMISSOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(compromissos, f, indent=4, ensure_ascii=False)

# --- ROTAS DA API ---

# ROTA PARA OBTER TODOS OS COMPROMISSOS (GET)
@app.route('/api/compromissos', methods=['GET'])
def get_compromissos():
    compromissos = ler_compromissos()
    return jsonify(compromissos)

# ROTA PARA ADICIONAR UM NOVO COMPROMISSO (POST)
@app.route('/api/compromissos', methods=['POST'])
def add_compromisso():
    novo_compromisso = request.json
    compromissos = ler_compromissos()
    compromissos.append(novo_compromisso)
    salvar_compromissos(compromissos)
    return jsonify(novo_compromisso), 201

# ROTA PARA ATUALIZAR UM COMPROMISSO (PUT)
@app.route('/api/compromissos/<int:id>', methods=['PUT'])
def update_compromisso(id):
    compromisso_atualizado = request.json
    compromissos = ler_compromissos()
    # Encontra o compromisso pelo ID e o atualiza
    compromissos = [comp if comp['id'] != id else compromisso_atualizado for comp in compromissos]
    salvar_compromissos(compromissos)
    return jsonify(compromisso_atualizado)

# ROTA PARA DELETAR UM COMPROMISSO (DELETE)
@app.route('/api/compromissos/<int:id>', methods=['DELETE'])
def delete_compromisso(id):
    compromissos = ler_compromissos()
    compromissos = [comp for comp in compromissos if comp['id'] != id]
    salvar_compromissos(compromissos)
    # Retorna uma resposta vazia com status de sucesso "No Content"
    return '', 204

if __name__ == '__main__':
    # Roda o servidor em modo de depuração, que reinicia automaticamente após alterações
    app.run(debug=True)