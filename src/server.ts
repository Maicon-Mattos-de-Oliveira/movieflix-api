import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// GET /movies – Lista todos os filmes
app.get("/movies", async (_, res) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { title: "asc" },
      include: { genres: true, languages: true },
    });
    return res.json(movies);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar filmes" });
  }
});

// POST /movies – Cria um novo filme
app.post("/movies", async (req, res) => {
  const { title, genre_id, language_id, oscar_count, release_date } = req.body;

  try {
    // Evita duplicar título (case-insensitive)
    const exists = await prisma.movie.findFirst({
      where: { title: { equals: title, mode: "insensitive" } },
    });
    if (exists) {
      return res.status(409).json({ message: "Já existe um filme com esse título" });
    }

    const newMovie = await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        release_date: new Date(release_date),
      },
    });

    return res.status(201).json({ message: "Filme criado com sucesso", movie: newMovie });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Falha ao cadastrar filme" });
  }
});

// PUT /movies/:id – Atualiza dados de um filme existente
app.put("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data: any = { ...req.body };

  // Converte release_date se veio no body
  if (data.release_date) {
    data.release_date = new Date(data.release_date);
  }

  try {
    // Verifica existência
    const movie = await prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      return res.status(404).json({ message: "Filme não encontrado" });
    }

    const updated = await prisma.movie.update({
      where: { id },
      data,
    });

    return res.json({ message: "Filme atualizado com sucesso", movie: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Falha ao atualizar filme" });
  }
});

app.delete("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const movie = await prisma.movie.findUnique({ where: { id } });

    if (!movie) {
      return res.status(404).send({ message: "O Filme não foi encontrado" })
    }

    await prisma.movie.delete({ where: { id } });
  } catch (error) {
    return res.status(500).send({ message: "Não foi possível remover o filme" });
  }

  res.status(200).send();
});

app.get("/movies/:genreName", async (req, res) => {

  try {
    const moviesFilteredByGenreName = await prisma.movie.findMany({
      include: {
        genres: true,
        languages: true

      },
      where: {
        genres: {
          name: {
            equals: req.params.genreName,
            mode: "insensitive"
          }
        }
      }
    });
    res.status(200).send(moviesFilteredByGenreName);
  } catch (error) {
    return res.status(500).send({ message: "Falha ao filtrar filmes por gênero" });
  }


});
// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
