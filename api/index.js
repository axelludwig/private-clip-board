const express = require("express");
const axios = require("axios");
const mariadb = require("mariadb");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const fileUpload = require("express-fileupload");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const apiport = 8000;
const port = 8001;

app.use(express.json());
io.origins("*:*");

app.use(express.json()); //Notice express.json middleware
app.use(fileUpload());

const pool = mariadb.createPool({
  // host: 'localhost',
  user: "clip",
  password: "board*",
  database: "clipboard",
  connectionLimit: 100,
  // port: 3306
});

io.on("connection", (socket) => {
  console.log("client connected");
  socket.on("test", () => {
    console.log("sockets ok");
    socket.emit("test2", "");
  });
  socket.on("update", () => {
    console.log("update");
    // socket.emit("test2", "");
  });
  socket.on("disconnect", () => console.log("disconnected"));
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.get("/clips", function (req, res) {
  // const body = req.query;
  // console.log(body);
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query("SELECT * from Clips")
        .then((rows) => {
          var array = [];
          rows.map((t) => array.push(t));
          res.json(array);
          conn.release();
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => {
      console.log("not connected");
      console.log(err);
    });
});

app.delete("/clips", function (req, res) {
  console.log(req.body);
  var query = "DELETE FROM Clips WHERE id = " + req.body.id + " ;"
  // console.log(query);
  pool
    .getConnection()
    .then((conn) => {
      conn.query(query).then((row) => {
        res.json(row);
        console.log(row);
        conn.release();
      });
    })
    .catch((err) => {
      console.log("not connected");
      console.log(err);
    });
});

app.post("/clips", function (req, res) {
  // console.log(req.body);
  var query =
    "INSERT INTO Clips(content, time, private, imagesrc)" +
    "values('" +
    req.body.content +
    "'  , CURRENT_TIMESTAMP ," +
    req.body.private +
    " ,'" +
    req.body.imagesrc +
    "')";
  // console.log(query);
  pool
    .getConnection()
    .then((conn) => {
      conn.query(query).then((row) => {
        console.log(row.insertId);
        res.json({ 'id': row.insertId });
        conn.release();
      });
    })
    .catch((err) => {
      console.log("not connected");
      console.log(err);
    });
});

app.get("/", (req, res) => {
  console.log("ok");
  res.send("server ok");
});

app.get("/images/:id", function (req, res) {
  var path = __dirname + "\\images\\" + req.params.id + "";
  try {
    if (fs.existsSync(path)) res.sendFile(path);
  } catch { }
  // var jpg = __dirname + '\\images\\' + req.params.id + '.jpg';
  // var png = __dirname + '\\images\\' + req.params.id + '.png';
  // var found = false;
  // try {
  //   if (fs.existsSync(jpg)) {
  //     found = true;
  //     res.sendFile(jpg)
  //   }
  // } catch { };
  // if (!found) {
  //   try {
  //     if (fs.existsSync(png)) res.sendFile(png)
  //   } catch { };
  // }
});

// app.post("/images", function (req, res) {
//   console.log('ok');
//   console.log(req.body  );
//   var path = __dirname + "\\images\\" + req.body.id + "";
//   try {
//     if (fs.existsSync(path)) res.sendFile(path);
//   } catch { }
// });

app.post("/image", function (req, res) {
  if (!req.files) return res.status(500).send({ msg: "file is not found" });
  var file = req.files.image;

  file.mv(__dirname + "/images/" + file.name, function (err) {
    if (err) {
      console.log(err);
      return res.status(500).send({ msg: "Error occured" });
    }
    // returing the response with file path and name
    console.log("file " + file.name + " downloaded");
    return res.send("file " + file.name + " uploaded");
  });
});

io.listen(port);
console.log("sockets listening on port ", port);

app.listen(apiport);
console.log("listening on port", apiport);
