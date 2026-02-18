const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');

const screeningRoute = require('./routes/screening');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',         // local React dev
    'https://your-frontend.onrender.com' // we'll update this after deploy
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.use('/api/screening', screeningRoute);

app.get('/', (req, res) => {
  res.send('Resume Screener API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}   );  
