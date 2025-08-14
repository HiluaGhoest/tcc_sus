// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexão com MongoDB
mongoose.connect('mongodb://localhost:27017/TCC_SUS', { // troque para sua string Atlas se quiser
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Modelo de usuário
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', UserSchema);

// Rota de registro
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Preencha todos os campos.' });

  try {
    const user = new User({ username, password });
    await user.save();
    res.json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Usuário já existe.' });
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// Rota de login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    res.json({ message: 'Login realizado com sucesso!' });
  } else {
    res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));