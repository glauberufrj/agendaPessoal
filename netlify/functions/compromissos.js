// netlify/functions/compromissos.js
import { Pool } from '@neondatabase/serverless';

export default async (req) => {
  // CRÍTICO: Usamos req.method em vez de req.httpMethod
  console.log(`Função iniciada. Método: ${req.method}.`);

  try {
    console.log("Tentando criar pool de conexão com o banco de dados...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log("✅ Pool de conexão criado com sucesso.");

    // CRÍTICO: Criamos um objeto URL para ler o caminho de forma segura
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/'); // Ex: ['', 'api', 'compromissos', '12345']
    const id = pathParts[3] || null; // Pega o ID se existir

    // --- LÓGICA PARA CADA TIPO DE REQUISIÇÃO ---

    // SE FOR GET (BUSCAR DADOS)
    if (req.method === 'GET') {
      console.log("Executando query para buscar todos os compromissos...");
      const { rows } = await pool.query("SELECT * FROM compromissos ORDER BY \"dataInicio\" ASC");
      console.log(`✅ Query executada. ${rows.length} registros encontrados.`);
      await pool.end();
      return new Response(JSON.stringify(rows), { status: 200 });
    }

    // SE FOR POST (ADICIONAR DADOS)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log("Executando query para INSERIR novo compromisso:", body.titulo);
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

    // SE FOR PUT (ATUALIZAR DADOS)
    if (req.method === 'PUT' && id) {
      const body = await req.json();
      console.log("Executando query para ATUALIZAR compromisso:", id);
      const { titulo, dataInicio, dataFim, recorrencia, descricao, participantes } = body;
      const query = `
        UPDATE compromissos
        SET titulo = $1, "dataInicio" = $2, "dataFim" = $3, recorrencia = $4, descricao = $5, participantes = $6
        WHERE id = $7 RETURNING *;
      `;
      const values = [titulo, dataInicio, dataFim, recorrencia, descricao, participantes, id];
      const { rows } = await pool.query(query, values);
      console.log("✅ Compromisso atualizado com sucesso.");
      await pool.end();
      return new Response(JSON.stringify(rows[0]), { status: 200 });
    }

    // SE FOR DELETE (DELETAR DADOS)
    if (req.method === 'DELETE' && id) {
      console.log("Executando query para DELETAR compromisso:", id);
      await pool.query("DELETE FROM compromissos WHERE id = $1", [id]);
      console.log("✅ Compromisso deletado com sucesso.");
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