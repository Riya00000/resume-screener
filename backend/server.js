const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const fs = require('fs'); 
const path = require('path'); 

const screeningRoute = require('./routes/screening');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
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
