const mysql = require('mysql2/promise');
const fs = require('fs');
const PATH = 'F:\\CypressWebsite\\cypress-realworld-app\\data\\database.json'
let inserting = false; // Flag to track if insertion is in progress

// Function to insert data into MySQL
async function insertData(data) {
  if (inserting) {
    console.log('Insertion already in progress');
    return;
}
inserting = true;
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'darius',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  const connection = await pool.getConnection();
  try {
    const user = data.users[data.users.length - 1]; // Get the last user
    const sql2 = `SELECT id FROM users WHERE id = ?`;
    const [rows] = await connection.execute(sql2, [user.id]); // Execute query and get results

    if(!rows.length){ 
    // Insert data into the MySQL database
      const values = [user.id, user.uuid, user.firstName, user.lastName, user.username, user.password, user.balance, user.createdAt, user.modifiedAt];
      const sql = `INSERT INTO users (id, uuid, firstName, lastName, username, password, balance, createdAt, modifiedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;      
      await connection.execute(sql, values);
    } else {
      console.log('User with ID', user.id, 'already exists. Skipping insertion.');
    }
    // Insert other data types similarly
  } finally {
    inserting = false;
    connection.release();
    pool.end();
  }
}

// Watch the JSON file for changes
fs.watch(PATH, (eventType, filename) => {
  if (eventType === 'change' || eventType ==='rename') {
    // Read the updated JSON file
    fs.readFile(PATH, 'utf8', (err, rawData) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return;
      }
      const data = JSON.parse(rawData);
      // Insert the new data into the MySQL database
      insertData(data)
        .then(() => console.log('Data inserted successfully'))
        .catch((error) => console.error('Error inserting data:', error));
    });
  }
});
console.log('Watching for changes in the JSON file...');