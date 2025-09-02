// netlify/functions/compromissos.js
import { Pool } from '@neondatabase/serverless';

export default async (req) => {
  console.log(`Função iniciada. Método: ${req.httpMethod}. Path: ${req.path}`);

  // Envolvemos TUDO em um bloco try...catch para capturar qualquer erro
  try {
    console.log("Tentando criar pool de conexão com o banco de dados...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log("✅ Pool de conexão criado com sucesso.");

    const pathParts = req.path.split('/');
    const id = pathParts.length > 3 ? pathParts[3] : null;

    // --- LÓGICA PARA CADA TIPO DE REQUISIÇÃO ---

    // SE FOR GET (BUSCAR DADOS)
    if (req.httpMethod === 'GET') {
      console.log("Executando query para buscar todos os compromissos...");
      const { rows } = await pool.query("SELECT * FROM compromissos ORDER BY \"dataInicio\" ASC");
      console.log(`✅ Query executada. ${rows.length} registros encontrados.`);
      await pool.end();
      return new Response(JSON.stringify(rows), { status: 200 });
    }

    // SE FOR POST (ADICIONAR DADOS)
    if (req.httpMethod === 'POST') {
      const body = await req.json();
      console.log("Executando query para INSERIR novo compromisso...", body.titulo);
      const { titulo, dataInicio, dataFim, recorrencia, descricao, participantes } = body;
      const query = `
        INSERT INTO compromissos (titulo, "dataInicio", "dataFim", recorrencia, descricao, participantes)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
      `;
      const values = [titulo, dataInicio, dataFim, recorrencia, descricao, participantes];
      const { rows } = await pool.query(query, values);
      console.log("✅ Novo compromisso inserido com sucesso.");
      await pool.end();
      return new Response(JSON.stringify(rows[0]), { status: 201 });
    }

    // ... (As lógicas de PUT e DELETE seguiriam o mesmo padrão de logging) ...

    return new Response("Método não permitido ou ID faltando", { status: 405 });

  } catch (error) {
    // ESTA É A PARTE MAIS IMPORTANTE
    console.error("!!!!!!!! ERRO CAPTURADO NA FUNÇÃO !!!!!!!!");
    console.error("Erro detalhado:", error);
    return new Response(JSON.stringify({ message: "Erro interno no servidor.", error: error.message }), { status: 500 });
  }
};