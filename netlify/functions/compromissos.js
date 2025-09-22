// netlify/functions/compromissos.js
import { Pool } from '@neondatabase/serverless';

export default async (req) => {
  console.log(`Função iniciada. Método: ${req.method}.`);

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[3] || null;

    // --- LÓGICA PARA CADA TIPO DE REQUISIÇÃO ---

    // GET (BUSCAR DADOS) - Não precisa de alteração
    if (req.method === 'GET') {
      const { rows } = await pool.query("SELECT * FROM compromissos ORDER BY \"dataInicio\" ASC");
      await pool.end();
      return new Response(JSON.stringify(rows), { status: 200 });
    }

    // POST (ADICIONAR DADOS) - Atualizado para incluir os novos campos
    if (req.method === 'POST') {
      const body = await req.json();
      const { titulo, dataInicio, dataFim, recorrencia, descricao, participantes, dia_da_semana, data_fim_recorrencia } = body;
      const query = `
        INSERT INTO compromissos (titulo, "dataInicio", "dataFim", recorrencia, descricao, participantes, dia_da_semana, data_fim_recorrencia)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
      `;
      const values = [titulo, dataInicio, dataFim, recorrencia, descricao, participantes, dia_da_semana, data_fim_recorrencia];
      const { rows } = await pool.query(query, values);
      await pool.end();
      return new Response(JSON.stringify(rows[0]), { status: 201 });
    }

    // PUT (ATUALIZAR DADOS) - Atualizado para incluir os novos campos
    if (req.method === 'PUT' && id) {
      const body = await req.json();
      const { titulo, dataInicio, dataFim, recorrencia, descricao, participantes, dia_da_semana, data_fim_recorrencia } = body;
      const query = `
        UPDATE compromissos
        SET titulo = $1, "dataInicio" = $2, "dataFim" = $3, recorrencia = $4, descricao = $5, participantes = $6, dia_da_semana = $7, data_fim_recorrencia = $8
        WHERE id = $9 RETURNING *;
      `;
      const values = [titulo, dataInicio, dataFim, recorrencia, descricao, participantes, dia_da_semana, data_fim_recorrencia, id];
      const { rows } = await pool.query(query, values);
      await pool.end();
      return new Response(JSON.stringify(rows[0]), { status: 200 });
    }

    // DELETE (DELETAR DADOS) - Não precisa de alteração
    if (req.method === 'DELETE' && id) {
      await pool.query("DELETE FROM compromissos WHERE id = $1", [id]);
      await pool.end();
      return new Response(null, { status: 204 });
    }

    await pool.end();
    return new Response("Método não permitido ou ID faltando", { status: 405 });

  } catch (error) {
    console.error("!!!!!!!! ERRO CAPTURADO NA FUNÇÃO !!!!!!!!");
    console.error("Erro detalhado:", error);
    return new Response(JSON.stringify({ message: "Erro interno no servidor.", error: error.message }), { status: 500 });
  }
};