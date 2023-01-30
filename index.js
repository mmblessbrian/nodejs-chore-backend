const express = require('express');
const app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.json());
require('dotenv').config();
const mongoose = require('mongoose');
const port = process.env.PORT;

mongoose.connect('mongodb://127.0.0.1:27017/choreDB').catch((error) => {
	console.log('failed to start server', error);
});

const choreSchema = new mongoose.Schema({
	name: String,
	chores: [String],
	token: String,
	username: String,
	password: String,
	display: String
});

const ChoreUser = mongoose.model('Chore', choreSchema);

function GetCookieAge() {
	return (1000 * 60 * 60 * 24 * process.env.COOKIE_AGE_DAYS) / 1000;
}

app.post('/login', async (req, res) => {
	try {
		let body = await req.body;

		body.username = body.username.toLowerCase();

		const user = await ChoreUser.findOne({ username: body.username, password: body.password }).select({ _id: 0, password: 0, username: 0 });
		if (user === null) {
			res.status(403).send('error: user not found or password incorrect');
			return;
		}

		res.cookie('token', user.token, { httpOnly: true, maxAge: GetCookieAge() }).json({ chores: user.chores, name: user.name, username: user.username });
		return;
	} catch (error) {
		res.status(400).send('error', 'response was not in json format. please send as json');
	}
});

app.post('/logout', async (req, res) => {
	res.cookie('token', '', { httpOnly: true, maxAge: -1 }).sendStatus(200);
});

app.get('/chores/:id', async (req, res) => {
	try {
		const user = await ChoreUser.findOne({ _id: req.params.id, token: req.cookies.token }).select({ _id: 0, chores: 1 });
		if (user === null) {
			res.status(403).send('error: id not found or incorrect token');
			return;
		}

		res.json({ chores: user.chores, name: user.name, username: user.username });
		return;
	} catch (error) {
		res.status(400).send('error');
	}
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
