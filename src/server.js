const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());

// Set up static file serving for the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle API routes
app.use('/api', require('./routes/apiRoutes'));

// Redirect root path to 'home.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
