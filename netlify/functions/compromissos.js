// netlify/functions/compromissos.js
import { Pool } from '@neondatabase/serverless';

export default async (req) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Pega o ID da URL, se houver (ex: /api/compromissos/12345)
  const pathParts = req.path.split('/');
  const id = pathParts.length > 3 ? pathParts[3] : null;

  try {
    // --- LÓGICA PARA CADA TIPO DE REQUISIÇÃO ---

    // SE FOR GET (BUSCAR DADOS)
    if (req.httpMethod === 'GET') {
      const { rows } = await pool.query("SELECT * FROM compromissos ORDER BY \"dataInicio\" ASC");
      return new Response(JSON.stringify(rows), { status: 200 });
    }

    // SE FOR POST (ADICIONAR DADOS)
    if (req.httpMethod === 'POST') {
      const body = await req.json();
      const { titulo, dataInicio, dataFim, recorrencia, descricao, participantes } = body;
      const query = `
        INSERT INTO compromissos (titulo, "dataInicio", "dataFim", recorrencia, descricao, participantes)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
      `;
      const values = [titulo, dataInicio, dataFim, recorrencia, descricao, participantes];
      const { rows } = await pool.query(query, values);
      return new Response(JSON.stringify(rows[0]), { status: 201 });
    }

    // SE FOR PUT (ATUALIZAR DADOS)
    if (req.httpMethod === 'PUT' && id) {
      const body = await req.json();
      const { titulo, dataInicio, dataFim, recorrencia, descricao, participantes } = body;
      const query = `
        UPDATE compromissos
        SET titulo = $1, "dataInicio" = $2, "dataFim" = $3, recorrencia = $4, descricao = $5, participantes = $6
        WHERE id = $7 RETURNING *;
      `;
      const values = [titulo, dataInicio, dataFim, recorrencia, descricao, participantes, id];
      const { rows } = await pool.query(query, values);
      return new Response(JSON.stringify(rows[0]), { status: 200 });
    }

    // SE FOR DELETE (DELETAR DADOS)
    if (req.httpMethod === 'DELETE' && id) {
      await pool.query("DELETE FROM compromissos WHERE id = $1", [id]);
      return new Response(null, { status: 204 }); // 204 No Content
    }

    return new Response("Método não permitido ou ID faltando", { status: 405 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await pool.end();
  }
};