const app = require('./api/index.js');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Anonymize endpoint: http://localhost:${PORT}/anonymize`);
});