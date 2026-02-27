import express from "express";
import cors from "cors";
const app = express();
const PORT = 3000;

const playData = [];
const loadData = [];
const freeData = [];
const buyFreeData = [];

let freeSpinCounter = 0;
let totalFreeWin = 0;
let playerBalance = 1500000;
let totalBet = 80000;
let jackpotWin = 25000;

let jackpot_prizes = {
	title: "Slot Jackpot",
	super: 1000,
	major: 500,
	mini: 10,
};

const ADD_FREE = 2;

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
	res.json({ success: true });
});

// Dummy POST endpoint
app.post("/load", (req, res) => {
	//playerBalance = 1200000;
	const load = structuredClone(loadData[0]);

	//check free spin
	if (load.data.free_spin != null) {
		freeSpinCounter = load.data.free_spin.count;
	}

	load.data.player.balance = playerBalance;
	load.data.jackpot_prizes = jackpot_prizes;

	totalFreeWin = loadData.total_win;

	res.json(load);
});

// Dummy GET endpoint
app.post("/play", (req, res) => {
	playerBalance -= totalBet;

	totalFreeWin = 0;

	//let play = structuredClone(playData[11]); //max win
	let play = structuredClone(generateRandomResult(playData));

	play.data.balance = playerBalance;

	if (play.data.win > 0) {
		playerBalance += play.data.win;
	}

	if (play.data.free_spin != null) {
		freeSpinCounter = ADD_FREE;
		play.data.free_spin.count = freeSpinCounter;
		totalFreeWin = play.data.win;
	} else {
		totalFreeWin = 0;
	}

	play.data.balance = playerBalance;

	jackpot_prizes.mini += 10;
	jackpot_prizes.major += 100;
	jackpot_prizes.super += 500;

	play.data.jackpot_prizes = jackpot_prizes;

	res.json(play);
});

// Dummy GET endpoint
app.post("/buy-free-game", (req, res) => {
	//totalbet x 10
	playerBalance -= totalBet * 10;
	totalFreeWin = 0;

	totalFreeWin = 0;
	let free = structuredClone(playData[7]); //buyFreeData[0];
	freeSpinCounter = ADD_FREE;
	free.data.free_spin.count = freeSpinCounter;
	totalFreeWin += free.data.win;
	free.data.total_win = totalFreeWin;
	free.data.balance = playerBalance;

	res.json(free);
});

// Dummy GET endpoint
app.post("/jackpot", (req, res) => {
	playerBalance += jackpotWin;
	let jackpot = {
		data: {
			win: jackpotWin,
			balance: playerBalance,
		},
		success: true,
	};
	res.json(jackpot);
});

// Dummy GET endpoint
app.post("/play-free-game", (req, res) => {
	let free = structuredClone(generateRandomResult(freeData));
	//let free = structuredClone(freeData[5]);
	//let free = structuredClone(freeData[11]);

	if (freeSpinCounter > 0) {
		freeSpinCounter -= 1;
	}

	if (free.data.free_spin != null) {
		if (free.data.free_spin.scatterCount > 2) {
			freeSpinCounter += ADD_FREE;
			free.data.free_spin.retrigger = true;
			free.data.free_spin.add = ADD_FREE;
		} else {
			free.data.free_spin.retrigger = false;
		}
		free.data.free_spin.count = freeSpinCounter;
	}

	if (free.data.total_win > 0) {
		totalFreeWin += free.data.total_win;
	}

	free.data.total_win = totalFreeWin;

	if (totalFreeWin > 30000000) {
		totalFreeWin = 30000000;
		free.data.total_win = totalFreeWin;
		free.data.max_win_hit = true;
		free.data.free_spin = null;
		freeSpinCounter = 0;
	}

	if (freeSpinCounter == 0) {
		playerBalance += totalFreeWin;
		free.data.balance = playerBalance;
	}

	free.data.balance = playerBalance;

	res.json(free);
});

app.listen(PORT, () => {
	console.log(`Dummy API running on http://localhost:${PORT}`);
});

function generateRandomResult(arr) {
	const rdm = Math.floor(Math.random() * arr.length);
	return arr[rdm];
}

//---------------
playData[0] = {
    "data": {
        "win": 2080,
        "slot": {
            "winnings": [
                {
                    "symbol": "s1",
                    "payout": 320,
                    "ways": 2,
                    "hasWild": false,
                    "direction": "ltr",
                    "length": 2
                },
                {
                    "symbol": "k",
                    "payout": 160,
                    "ways": 2,
                    "hasWild": false,
                    "direction": "rtl",
                    "length": 2
                }
            ],
            "reel": [
                [
                    "s2",
                    "s1",
                    "s3"
                ],
                [
                    "s1",
                    "s2",
                    "s2"
                ],
                [
                    "s1",
                    "k",
                    "s1"
                ],
                [
                    "s3",
                    "s2",
                    "k"
                ],
                [
                    "s4",
                    "k",
                    "k"
                ]
            ],
            "multiplier": 1,
            "cascaded": [
                {
                    "winnings": [
                        {
                            "symbol": "s2",
                            "payout": 800,
                            "ways": 2,
                            "hasWild": false,
                            "direction": "ltr",
                            "length": 3
                        }
                    ],
                    "type": "cascade",
                    "win": 1600,
                    "multiplier": 2,
                    "rng": [
                        [
                            "k",
                            "s2",
                            "s3"
                        ],
                        [
                            "s3",
                            "s2",
                            "s2"
                        ],
                        [
                            "j",
                            "a",
                            "s2"
                        ],
                        [
                            "k",
                            "s3",
                            "s2"
                        ],
                        [
                            "s1",
                            "s3",
                            "s4"
                        ]
                    ],
                    "cascades": [
                        {
                            "column": 0,
                            "row": 0,
                            "symbol": "k"
                        },
                        {
                            "column": 1,
                            "row": 0,
                            "symbol": "s3"
                        },
                        {
                            "column": 2,
                            "row": 0,
                            "symbol": "j"
                        },
                        {
                            "column": 2,
                            "row": 1,
                            "symbol": "a"
                        },
                        {
                            "column": 2,
                            "row": 2,
                            "symbol": "s2"
                        },
                        {
                            "column": 3,
                            "row": 0,
                            "symbol": "k"
                        },
                        {
                            "column": 4,
                            "row": 0,
                            "symbol": "s1"
                        },
                        {
                            "column": 4,
                            "row": 1,
                            "symbol": "s3"
                        }
                    ]
                },
                {
                    "winnings": [],
                    "type": "cascade",
                    "win": 0,
                    "multiplier": 3,
                    "rng": [
                        [
                            "s1",
                            "k",
                            "s3"
                        ],
                        [
                            "s1",
                            "wild",
                            "s3"
                        ],
                        [
                            "s2",
                            "j",
                            "a"
                        ],
                        [
                            "s1",
                            "k",
                            "s3"
                        ],
                        [
                            "s1",
                            "s3",
                            "s4"
                        ]
                    ],
                    "cascades": [
                        {
                            "column": 0,
                            "row": 0,
                            "symbol": "s1"
                        },
                        {
                            "column": 1,
                            "row": 0,
                            "symbol": "s1"
                        },
                        {
                            "column": 1,
                            "row": 1,
                            "symbol": "wild"
                        },
                        {
                            "column": 2,
                            "row": 0,
                            "symbol": "s2"
                        },
                        {
                            "column": 3,
                            "row": 0,
                            "symbol": "s1"
                        }
                    ]
                }
            ]
        },
        "free_spin": null,
        "total_win": 17640,
        "max_win_hit": false,
        "balance": 135221426,
        "jackpots": null
    },
    "success": true,
    "request_id": "8f5a0c54-a77c-4b1f-bce6-f67c5b5088e3",
    "api_version": "0.1.15"
}

playData[1] = {
	data: {
		total_win: 140000,
		win: 20000,
		slot: {
			winnings: [
				{
					symbol: "a",
					payout: 20000,
					ways: 1,
					hasWild: false,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["j", "s1", "a"],
				["q", "a", "s2"],
				["s3", "s1", "a"],
				["j", "s2", "s3"],
				["s4", "a", "s3"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "s1",
							payout: 30000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["q", "j", "s1"],
						["s1", "q", "s2"],
						["j", "s3", "s1"],
						["j", "s2", "s3"],
						["s4", "a", "s3"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 0,
							symbol: "s1",
						},
						{
							column: 2,
							row: 0,
							symbol: "j",
						},
					],
					win: 60000,
					multiplier: 2,
				},
				{
					winnings: [
						{
							symbol: "q",
							payout: 20000,
							ways: 4,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["q", "q", "j"],
						["q", "q", "s2"],
						["q", "j", "s3"],
						["j", "s2", "s3"],
						["s4", "a", "s3"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 0,
							symbol: "q",
						},
						{
							column: 2,
							row: 0,
							symbol: "q",
						},
					],
					win: 60000,
					multiplier: 3,
				},
				{
					winnings: [],
					rng: [
						["s4", "a", "j"],
						["s2", "sc", "s2"],
						["s3", "j", "s3"],
						["j", "s2", "s3"],
						["s4", "a", "s3"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s4",
						},
						{
							column: 0,
							row: 1,
							symbol: "a",
						},
						{
							column: 1,
							row: 0,
							symbol: "s2",
						},
						{
							column: 1,
							row: 1,
							symbol: "sc",
						},
						{
							column: 2,
							row: 0,
							symbol: "s3",
						},
					],
					win: 0,
					multiplier: 4,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "1000.000000",
			major: "500.000000",
			mini: "100.000000",
		},
	},
	success: true,
	request_id: "b392b806-758a-4baf-8616-b7f88bf790f6",
};

playData[2] = {
	data: {
		total_win: 502000,
		win: 40000,
		slot: {
			winnings: [
				{
					symbol: "q",
					payout: 40000,
					ways: 4,
					hasWild: false,
					direction: "ltr",
					length: 3,
				},
			],
			reel: [
				["j", "q", "a"],
				["q", "k", "q"],
				["j", "q", "j"],
				["a", "q", "q"],
				["a", "s2", "j"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "j",
							payout: 16000,
							ways: 2,
							hasWild: true,
							direction: "ltr",
							length: 4,
						},
					],
					rng: [
						["s2", "j", "a"],
						["j", "s4", "k"],
						["k", "j", "j"],
						["wild", "a", "a"],
						["a", "s2", "j"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{ column: 0, row: 0, symbol: "s2" },
						{ column: 1, row: 0, symbol: "j" },
						{ column: 1, row: 1, symbol: "s4" },
						{ column: 2, row: 0, symbol: "k" },
						{ column: 3, row: 0, symbol: "wild" },
						{ column: 3, row: 1, symbol: "a" },
					],
					win: 32000,
					multiplier: 2,
				},
				{
					winnings: [
						{
							symbol: "k",
							payout: 10000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["k", "s2", "a"],
						["j", "s4", "k"],
						["s1", "s2", "k"],
						["sc", "a", "a"],
						["s2", "a", "s2"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{ column: 0, row: 0, symbol: "k" },
						{ column: 1, row: 0, symbol: "j" },
						{ column: 2, row: 0, symbol: "s1" },
						{ column: 2, row: 1, symbol: "s2" },
						{ column: 3, row: 0, symbol: "sc" },
						{ column: 4, row: 0, symbol: "s2" },
					],
					win: 30000,
					multiplier: 3,
				},
				{
					winnings: [
						{
							symbol: "s4",
							payout: 100000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["s4", "s2", "a"],
						["s1", "j", "s4"],
						["s4", "s1", "s2"],
						["sc", "a", "a"],
						["s2", "a", "s2"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{ column: 0, row: 0, symbol: "s4" },
						{ column: 1, row: 0, symbol: "s1" },
						{ column: 2, row: 0, symbol: "s4" },
					],
					win: 400000,
					multiplier: 4,
				},
				{
					winnings: [],
					rng: [
						["s2", "s2", "a"],
						["q", "s1", "j"],
						["sc", "s1", "s2"],
						["sc", "a", "a"],
						["s2", "a", "s2"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{ column: 0, row: 0, symbol: "s2" },
						{ column: 1, row: 0, symbol: "q" },
						{ column: 2, row: 0, symbol: "sc" },
					],
					win: 0,
					multiplier: 5,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "2000.000000",
			major: "1500.000000",
			mini: "1100.000000",
		},
	},
	success: true,
	request_id: "48547869-4684-4e77-a1a9-0ec38110df39",
};

playData[3] = {
	data: {
		total_win: 30000,
		win: 30000,
		slot: {
			winnings: [
				{
					symbol: "k",
					payout: 10000,
					ways: 1,
					hasWild: true,
					direction: "ltr",
					length: 2,
				},
				{
					symbol: "q",
					payout: 20000,
					ways: 2,
					hasWild: true,
					direction: "ltr",
					length: 3,
				},
			],
			reel: [
				["k", "s2", "q"],
				["wild", "q", "a"],
				["k", "s1", "q"],
				["a", "q", "s1"],
				["s4", "a", "s3"],
			],
			cascaded: [
				{
					winnings: [],
					rng: [
						["k", "a", "s2"],
						["j", "k", "a"],
						["q", "s1", "s1"],
						["a", "a", "s1"],
						["s4", "a", "s3"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{ column: 0, row: 0, symbol: "k" },
						{ column: 0, row: 1, symbol: "a" },
						{ column: 1, row: 0, symbol: "j" },
						{ column: 1, row: 1, symbol: "k" },
						{ column: 2, row: 0, symbol: "q" },
						{ column: 2, row: 1, symbol: "s1" },
						{ column: 3, row: 0, symbol: "a" },
					],
					win: 0,
					multiplier: 2,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "2000.000000",
			major: "1500.000000",
			mini: "1100.000000",
		},
	},
	success: true,
	request_id: "199e2929-c54a-4b9b-855a-867b4ea2b2f5",
};

playData[4] = {
	data: {
		total_win: 34000,
		win: 34000,
		slot: {
			winnings: [
				{
					symbol: "a",
					payout: 30000,
					ways: 1,
					hasWild: false,
					direction: "ltr",
					length: 3,
				},
				{
					symbol: "j",
					payout: 4000,
					ways: 2,
					hasWild: false,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["q", "a", "j"],
				["a", "j", "j"],
				["k", "a", "j"],
				["q", "a", "s3"],
				["s1", "k", "s4"],
			],
			cascaded: [
				{
					winnings: [],
					rng: [
						["j", "j", "q"],
						["s3", "j", "k"],
						["s2", "s3", "k"],
						["q", "q", "s3"],
						["s1", "k", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{ column: 0, row: 0, symbol: "j" },
						{ column: 0, row: 1, symbol: "j" },
						{ column: 1, row: 0, symbol: "s3" },
						{ column: 1, row: 1, symbol: "j" },
						{ column: 1, row: 2, symbol: "k" },
						{ column: 2, row: 0, symbol: "s2" },
						{ column: 2, row: 1, symbol: "s3" },
						{ column: 3, row: 0, symbol: "q" },
					],
					win: 0,
					multiplier: 2,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "2000.000000",
			major: "1500.000000",
			mini: "1100.000000",
		},
	},
	success: true,
	request_id: "102d4f7f-018a-4bb4-a616-3c38f4e0b259",
};

playData[5] = {
	data: {
		total_win: 28000,
		win: 28000,
		slot: {
			winnings: [
				{
					symbol: "a",
					payout: 20000,
					ways: 1,
					hasWild: true,
					direction: "ltr",
					length: 2,
				},
				{
					symbol: "j",
					payout: 8000,
					ways: 4,
					hasWild: true,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["k", "a", "j"],
				["wild", "j", "sc"],
				["a", "j", "j"],
				["q", "s1", "s4"],
				["a", "j", "sc"],
			],
			cascaded: [
				{
					winnings: [],
					rng: [
						["a", "q", "k"],
						["s2", "s1", "sc"],
						["k", "k", "j"],
						["q", "s1", "s4"],
						["a", "j", "sc"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{ column: 0, row: 0, symbol: "a" },
						{ column: 0, row: 1, symbol: "q" },
						{ column: 1, row: 0, symbol: "s2" },
						{ column: 1, row: 1, symbol: "s1" },
						{ column: 2, row: 0, symbol: "k" },
						{ column: 2, row: 1, symbol: "k" },
						{ column: 2, row: 2, symbol: "j" },
					],
					win: 0,
					multiplier: 2,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "2000.000000",
			major: "1500.000000",
			mini: "1100.000000",
		},
	},
	success: true,
	request_id: "0a827bc5-6379-4592-9edc-fecaaa58dc11",
};

playData[6] = {
	data: {
		total_win: 116000,
		win: 16000,
		slot: {
			winnings: [
				{
					symbol: "j",
					payout: 16000,
					ways: 4,
					hasWild: true,
					direction: "ltr",
					length: 3,
				},
			],
			reel: [
				["j", "s1", "k"],
				["a", "q", "j"],
				["s4", "j", "j"],
				["wild", "j", "k"],
				["q", "q", "k"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "q",
							payout: 30000,
							ways: 2,
							hasWild: false,
							direction: "ltr",
							length: 4,
						},
						{
							symbol: "k",
							payout: 20000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 4,
						},
					],
					rng: [
						["q", "s1", "k"],
						["k", "a", "q"],
						["q", "k", "s4"],
						["s1", "q", "k"],
						["q", "q", "k"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 0,
							symbol: "k",
						},
						{
							column: 2,
							row: 0,
							symbol: "q",
						},
						{
							column: 2,
							row: 1,
							symbol: "k",
						},
						{
							column: 3,
							row: 0,
							symbol: "s1",
						},
						{
							column: 3,
							row: 1,
							symbol: "q",
						},
					],
					win: 100000,
					multiplier: 2,
				},
				{
					winnings: [],
					rng: [
						["q", "j", "s1"],
						["k", "s1", "a"],
						["q", "s4", "s4"],
						["s4", "k", "s1"],
						["a", "s3", "a"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 0,
							row: 1,
							symbol: "j",
						},
						{
							column: 1,
							row: 0,
							symbol: "k",
						},
						{
							column: 1,
							row: 1,
							symbol: "s1",
						},
						{
							column: 2,
							row: 0,
							symbol: "q",
						},
						{
							column: 2,
							row: 1,
							symbol: "s4",
						},
						{
							column: 3,
							row: 0,
							symbol: "s4",
						},
						{
							column: 3,
							row: 1,
							symbol: "k",
						},
						{
							column: 4,
							row: 0,
							symbol: "a",
						},
						{
							column: 4,
							row: 1,
							symbol: "s3",
						},
						{
							column: 4,
							row: 2,
							symbol: "a",
						},
					],
					win: 0,
					multiplier: 3,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: null,
	},
	success: true,
	request_id: "35e7eed9-c8fa-42d6-8ebc-13fa7a420f01",
};

playData[7] = {
	data: {
		total_win: 6000,
		win: 6000,
		slot: {
			winnings: [
				{
					symbol: "a",
					payout: 6000,
					ways: 1,
					hasWild: false,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["s1", "sc", "a"],
				["j", "sc", "a"],
				["s3", "sc", "a"],
				["s4", "sc", "s1"],
				["s3", "sc", "s4"],
			],
			cascaded: [
				{
					winnings: [],
					rng: [
						["q", "s1", "sc"],
						["wild", "j", "sc"],
						["a", "s3", "sc"],
						["s4", "sc", "s1"],
						["s3", "sc", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 0,
							symbol: "wild",
						},
						{
							column: 2,
							row: 0,
							symbol: "a",
						},
					],
					win: 0,
					multiplier: 2,
				},
			],
		},
		balance: 0,
		free_spin: {
			count: 14,
			scatterCount: 5,
			retrigger: false,
			new_multiplier: null,
		},
		jackpot_prizes: {
			id: 1,
			currency: "IDR",
			jackpot_id: 1,
			super: 10596.58875,
			major: "9266.636568",
			mini: "5180.399169",
		},
	},
	success: true,
	request_id: "f3d91aed-e955-4b7a-820f-42775c0e05a9",
};

//no win
playData[8] = {
	data: {
		total_win: 0,
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["s2", "j", "a"],
				["s3", "q", "k"],
				["q", "a", "k"],
				["s2", "q", "j"],
				["a", "s4", "a"],
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: {
			id: 1,
			currency: "IDR",
			jackpot_id: 1,
			super: "15881.140121",
			major: "24066.636568",
			mini: 18381.96723548,
		},
	},
	success: true,
	request_id: "78298237-c026-458d-a4a9-bf72f533e720",
};

playData[9] = {
	data: {
		total_win: 579000,
		win: 3000,
		slot: {
			winnings: [
				{
					symbol: "q",
					payout: 3000,
					ways: 1,
					hasWild: false,
					direction: "rtl",
					length: 2,
				},
			],
			reel: [
				["j", "a", "j"],
				["s3", "a", "s3"],
				["k", "q", "s2"],
				["j", "q", "s3"],
				["s1", "s2", "q"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "s2",
							payout: 15000,
							ways: 1,
							hasWild: false,
							direction: "rtl",
							length: 2,
						},
					],
					rng: [
						["j", "a", "j"],
						["s3", "a", "s3"],
						["q", "k", "s2"],
						["s2", "j", "s3"],
						["s3", "s1", "s2"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 2,
							row: 0,
							symbol: "q",
						},
						{
							column: 3,
							row: 0,
							symbol: "s2",
						},
						{
							column: 4,
							row: 0,
							symbol: "s3",
						},
					],
					win: 30000,
					multiplier: 2,
				},
				{
					winnings: [
						{
							symbol: "s1",
							payout: 10000,
							ways: 1,
							hasWild: false,
							direction: "rtl",
							length: 2,
						},
					],
					rng: [
						["j", "a", "j"],
						["s3", "a", "s3"],
						["s1", "q", "k"],
						["s1", "j", "s3"],
						["j", "s3", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 2,
							row: 0,
							symbol: "s1",
						},
						{
							column: 3,
							row: 0,
							symbol: "s1",
						},
						{
							column: 4,
							row: 0,
							symbol: "j",
						},
					],
					win: 30000,
					multiplier: 3,
				},
				{
					winnings: [
						{
							symbol: "q",
							payout: 3000,
							ways: 1,
							hasWild: false,
							direction: "rtl",
							length: 2,
						},
						{
							symbol: "j",
							payout: 1000,
							ways: 1,
							hasWild: false,
							direction: "rtl",
							length: 2,
						},
					],
					rng: [
						["j", "a", "j"],
						["s3", "a", "s3"],
						["j", "q", "k"],
						["q", "j", "s3"],
						["q", "j", "s3"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 2,
							row: 0,
							symbol: "j",
						},
						{
							column: 3,
							row: 0,
							symbol: "q",
						},
						{
							column: 4,
							row: 0,
							symbol: "q",
						},
					],
					win: 16000,
					multiplier: 4,
				},
				{
					winnings: [
						{
							symbol: "s3",
							payout: 100000,
							ways: 4,
							hasWild: false,
							direction: "rtl",
							length: 3,
						},
					],
					rng: [
						["j", "a", "j"],
						["s3", "a", "s3"],
						["s3", "s3", "k"],
						["j", "sc", "s3"],
						["j", "j", "s3"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 2,
							row: 0,
							symbol: "s3",
						},
						{
							column: 2,
							row: 1,
							symbol: "s3",
						},
						{
							column: 3,
							row: 0,
							symbol: "j",
						},
						{
							column: 3,
							row: 1,
							symbol: "sc",
						},
						{
							column: 4,
							row: 0,
							symbol: "j",
						},
						{
							column: 4,
							row: 1,
							symbol: "j",
						},
					],
					win: 500000,
					multiplier: 5,
				},
				{
					winnings: [],
					rng: [
						["j", "a", "j"],
						["a", "q", "a"],
						["s1", "s4", "k"],
						["j", "j", "sc"],
						["q", "j", "j"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 1,
							row: 0,
							symbol: "a",
						},
						{
							column: 1,
							row: 1,
							symbol: "q",
						},
						{
							column: 2,
							row: 0,
							symbol: "s1",
						},
						{
							column: 2,
							row: 1,
							symbol: "s4",
						},
						{
							column: 3,
							row: 0,
							symbol: "j",
						},
						{
							column: 4,
							row: 0,
							symbol: "q",
						},
					],
					win: 0,
					multiplier: 6,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: null,
	},
	success: true,
	request_id: "afc798bf-1611-407f-be2e-de0758050092",
};

playData[10] = {
	data: {
		win: 980000,
		slot: {
			winnings: [
				{
					symbol: "s2",
					payout: 60000,
					ways: 2,
					hasWild: false,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["s1", "s1", "s2"],
				["s4", "s2", "s2"],
				["s4", "s2", "s3"],
				["s3", "a", "j"],
				["q", "s4", "s1"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "s4",
							payout: 60000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["s4", "s1", "s1"],
						["s3", "s1", "s4"],
						["k", "s4", "s3"],
						["s3", "a", "j"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s4",
						},
						{
							column: 1,
							row: 0,
							symbol: "s3",
						},
						{
							column: 1,
							row: 1,
							symbol: "s1",
						},
						{
							column: 2,
							row: 0,
							symbol: "k",
						},
					],
					win: 120000,
					multiplier: 2,
				},
				{
					winnings: [
						{
							symbol: "s4",
							payout: 60000,
							ways: 1,
							hasWild: true,
							direction: "ltr",
							length: 2,
						},
						{
							symbol: "s1",
							payout: 32000,
							ways: 2,
							hasWild: true,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["s4", "s1", "s1"],
						["s4", "s3", "s1"],
						["wild", "k", "s3"],
						["s3", "a", "j"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s4",
						},
						{
							column: 1,
							row: 0,
							symbol: "s4",
						},
						{
							column: 2,
							row: 0,
							symbol: "wild",
						},
					],
					win: 276000,
					multiplier: 3,
				},
				{
					winnings: [
						{
							symbol: "j",
							payout: 6000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 3,
						},
					],
					rng: [
						["j", "s4", "s4"],
						["s4", "j", "s3"],
						["j", "k", "s3"],
						["s3", "a", "j"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "j",
						},
						{
							column: 0,
							row: 1,
							symbol: "s4",
						},
						{
							column: 0,
							row: 2,
							symbol: "s4",
						},
						{
							column: 1,
							row: 0,
							symbol: "s4",
						},
						{
							column: 1,
							row: 1,
							symbol: "j",
						},
						{
							column: 2,
							row: 0,
							symbol: "j",
						},
					],
					win: 24000,
					multiplier: 4,
				},
				{
					winnings: [
						{
							symbol: "s3",
							payout: 100000,
							ways: 2,
							hasWild: false,
							direction: "ltr",
							length: 3,
						},
					],
					rng: [
						["s3", "s4", "s4"],
						["s1", "s4", "s3"],
						["s2", "k", "s3"],
						["s3", "s3", "a"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s3",
						},
						{
							column: 1,
							row: 0,
							symbol: "s1",
						},
						{
							column: 2,
							row: 0,
							symbol: "s2",
						},
						{
							column: 3,
							row: 0,
							symbol: "s3",
						},
					],
					win: 500000,
					multiplier: 5,
				},
				{
					winnings: [],
					rng: [
						["a", "s4", "s4"],
						["k", "s1", "s4"],
						["s1", "s2", "k"],
						["q", "s4", "a"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "a",
						},
						{
							column: 1,
							row: 0,
							symbol: "k",
						},
						{
							column: 2,
							row: 0,
							symbol: "s1",
						},
						{
							column: 3,
							row: 0,
							symbol: "q",
						},
						{
							column: 3,
							row: 1,
							symbol: "s4",
						},
					],
					win: 0,
					multiplier: 6,
				},
			],
		},

		total_win: 2434000,
		balance: 0,
	},
	success: true,
	request_id: "20d4a098-de2c-42ea-9970-c051008911ac",
};

playData[11] = {
	data: {
		total_win: 60000000,
		win: 80000000,
		max_win_hit: true,
		slot: {
			winnings: [
				{
					symbol: "s4",
					payout: 80000000,
					ways: 72,
					hasWild: false,
					direction: "ltr",
					length: 4,
				},
			],
			reel: [
				["s4", "s4", "s4"],
				["s4", "s4", "s4"],
				["s4", "s4", "sc"],
				["s4", "s4", "sc"],
				["s4", "s4", "sc"],
			],
			cascaded: [
				{
					winnings: [],
					rng: [
						["q", "q", "k"],
						["q", "k", "s3"],
						["s1", "s4", "sc"],
						["k", "s2", "sc"],
						["k", "j", "sc"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 0,
							row: 1,
							symbol: "q",
						},
						{
							column: 0,
							row: 2,
							symbol: "k",
						},
						{
							column: 1,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 1,
							symbol: "k",
						},
						{
							column: 1,
							row: 2,
							symbol: "s3",
						},
						{
							column: 2,
							row: 0,
							symbol: "s1",
						},
						{
							column: 2,
							row: 1,
							symbol: "s4",
						},
						{
							column: 3,
							row: 0,
							symbol: "k",
						},
						{
							column: 3,
							row: 1,
							symbol: "s2",
						},
						{
							column: 4,
							row: 0,
							symbol: "k",
						},
						{
							column: 4,
							row: 1,
							symbol: "j",
						},
					],
					win: 0,
					multiplier: 2,
				},
			],
		},
		balance: 0,
		free_spin: null,
		jackpot_prizes: {
			id: 1,
			currency: "IDR",
			jackpot_id: 1,
			super: "153300.000000",
			major: "153300.000000",
			mini: 30739.7448261,
		},
	},
	success: true,
	request_id: "23e5d6d3-8949-46d6-afeb-8d13e8f17898",
};

///free

freeData[0] = {
	data: {
		win: 160000,
		slot: {
			winnings: [
				{
					symbol: "k",
					payout: 40000,
					ways: 2,
					hasWild: true,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["j", "sc", "k"],
				["a", "wild", "s3"],
				["k", "sc", "k"],
				["s2", "j", "q"],
				["s3", "s1", "a"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "s1",
							payout: 60000,
							ways: 1,
							hasWild: true,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["s1", "j", "sc"],
						["s1", "a", "s3"],
						["s2", "wild", "sc"],
						["s2", "j", "q"],
						["s3", "s1", "a"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s1",
						},
						{
							column: 1,
							row: 0,
							symbol: "s1",
						},
						{
							column: 2,
							row: 0,
							symbol: "s2",
						},
						{
							column: 2,
							row: 1,
							symbol: "wild",
						},
					],
					win: 120000,
					multiplier: 2,
				},
				{
					winnings: [],
					rng: [
						["s3", "j", "sc"],
						["j", "a", "s3"],
						["a", "s2", "sc"],
						["s2", "j", "q"],
						["s3", "s1", "a"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s3",
						},
						{
							column: 1,
							row: 0,
							symbol: "j",
						},
						{
							column: 2,
							row: 0,
							symbol: "a",
						},
					],
					win: 0,
					multiplier: 3,
				},
			],
		},
		free_spin: {
			count: 10,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 160000,
		balance: 0,
	},
	success: true,
	request_id: "2ad77eb7-b02c-418d-a5fb-ccfe779ff67a",
};

freeData[1] = {
	data: {
		win: 148000,
		slot: {
			winnings: [
				{
					symbol: "s2",
					payout: 80000,
					ways: 1,
					hasWild: false,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["s1", "s2", "s1"],
				["q", "q", "s2"],
				["j", "s2", "s1"],
				["s3", "s3", "s1"],
				["a", "s3", "s4"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "j",
							payout: 4000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["j", "s1", "s1"],
						["j", "q", "q"],
						["q", "j", "s1"],
						["s3", "s3", "s1"],
						["a", "s3", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "j",
						},
						{
							column: 1,
							row: 0,
							symbol: "j",
						},
						{
							column: 2,
							row: 0,
							symbol: "q",
						},
					],
					win: 8000,
					multiplier: 2,
				},
				{
					winnings: [
						{
							symbol: "q",
							payout: 20000,
							ways: 2,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["q", "s1", "s1"],
						["k", "q", "q"],
						["sc", "q", "s1"],
						["s3", "s3", "s1"],
						["a", "s3", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 0,
							symbol: "k",
						},
						{
							column: 2,
							row: 0,
							symbol: "sc",
						},
					],
					win: 60000,
					multiplier: 3,
				},
				{
					winnings: [],
					rng: [
						["a", "s1", "s1"],
						["q", "k", "k"],
						["q", "sc", "s1"],
						["s3", "s3", "s1"],
						["a", "s3", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "a",
						},
						{
							column: 1,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 1,
							symbol: "k",
						},
						{
							column: 2,
							row: 0,
							symbol: "q",
						},
					],
					win: 0,
					multiplier: 4,
				},
			],
		},
		free_spin: {
			count: 9,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 308000,
		balance: 0,
	},
	success: true,
	request_id: "376bbfac-e7b4-4322-86d7-b3a5e97a1000",
};

freeData[2] = {
	data: {
		win: 158000,
		slot: {
			winnings: [
				{
					symbol: "q",
					payout: 30000,
					ways: 1,
					hasWild: false,
					direction: "ltr",
					length: 4,
				},
			],
			reel: [
				["k", "q", "k"],
				["s3", "q", "j"],
				["a", "s2", "q"],
				["j", "q", "s2"],
				["j", "s4", "q"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "a",
							payout: 40000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["a", "k", "k"],
						["a", "s3", "j"],
						["s1", "a", "s2"],
						["s2", "j", "s2"],
						["s2", "j", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "a",
						},
						{
							column: 1,
							row: 0,
							symbol: "a",
						},
						{
							column: 2,
							row: 0,
							symbol: "s1",
						},
						{
							column: 3,
							row: 0,
							symbol: "s2",
						},
						{
							column: 4,
							row: 0,
							symbol: "s2",
						},
					],
					win: 80000,
					multiplier: 2,
				},
				{
					winnings: [
						{
							symbol: "j",
							payout: 16000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 4,
						},
					],
					rng: [
						["j", "k", "k"],
						["a", "s3", "j"],
						["j", "s1", "s2"],
						["s2", "j", "s2"],
						["s2", "j", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "j",
						},
						{
							column: 1,
							row: 0,
							symbol: "a",
						},
						{
							column: 2,
							row: 0,
							symbol: "j",
						},
					],
					win: 48000,
					multiplier: 3,
				},
				{
					winnings: [],
					rng: [
						["s1", "k", "k"],
						["q", "a", "s3"],
						["k", "s1", "s2"],
						["a", "s2", "s2"],
						["j", "s2", "s4"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s1",
						},
						{
							column: 1,
							row: 0,
							symbol: "q",
						},
						{
							column: 2,
							row: 0,
							symbol: "k",
						},
						{
							column: 3,
							row: 0,
							symbol: "a",
						},
						{
							column: 4,
							row: 0,
							symbol: "j",
						},
					],
					win: 0,
					multiplier: 4,
				},
			],
		},
		free_spin: {
			count: 8,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 466000,
		balance: 0,
	},
	success: true,
	request_id: "5158b31e-4151-4984-a23d-6f0af2c1340d",
};

freeData[3] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["q", "s1", "a"],
				["j", "s1", "j"],
				["j", "j", "a"],
				["k", "s4", "s2"],
				["s1", "j", "s2"],
			],
		},
		free_spin: {
			count: 7,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

freeData[4] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["a", "s1", "s3"],
				["s3", "q", "j"],
				["j", "j", "a"],
				["k", "s4", "s2"],
				["s3", "j", "s2"],
			],
		},
		free_spin: {
			count: 7,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

freeData[5] = {
	data: {
		win: 40000,
		slot: {
			winnings: [
				{
					symbol: "q",
					payout: 10000,
					ways: 1,
					hasWild: false,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["k", "q", "j"],
				["s1", "q", "j"],
				["s4", "q", "k"],
				["a", "j", "a"],
				["s4", "j", "q"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "j",
							payout: 15000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 4,
						},
					],
					rng: [
						["q", "k", "j"],
						["s3", "s1", "j"],
						["j", "s4", "k"],
						["a", "j", "a"],
						["s4", "j", "q"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "q",
						},
						{
							column: 1,
							row: 0,
							symbol: "s3",
						},
						{
							column: 2,
							row: 0,
							symbol: "j",
						},
					],
					win: 30000,
					multiplier: 2,
				},
				{
					winnings: [],
					rng: [
						["s1", "q", "k"],
						["q", "s3", "s1"],
						["j", "s4", "k"],
						["j", "a", "a"],
						["s3", "s4", "q"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s1",
						},
						{
							column: 1,
							row: 0,
							symbol: "q",
						},
						{
							column: 2,
							row: 0,
							symbol: "j",
						},
						{
							column: 3,
							row: 0,
							symbol: "j",
						},
						{
							column: 4,
							row: 0,
							symbol: "s3",
						},
					],
					win: 0,
					multiplier: 3,
				},
			],
		},
		free_spin: {
			count: 6,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 40000,
		balance: 0,
	},
	success: true,
	request_id: "82d50d8e-cf63-48d4-b7f1-1e4716acfeb5",
};

freeData[6] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["k", "a", "a"],
				["k", "j", "j"],
				["j", "j", "a"],
				["k", "s4", "s2"],
				["s1", "j", "s2"],
			],
		},
		free_spin: {
			count: 7,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

freeData[7] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["a", "s1", "a"],
				["s4", "s1", "s4"],
				["j", "k", "a"],
				["k", "s4", "s3"],
				["s1", "j", "s2"],
			],
		},
		free_spin: {
			count: 7,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

freeData[8] = {
	data: {
		win: 980000,
		slot: {
			winnings: [
				{
					symbol: "s2",
					payout: 60000,
					ways: 2,
					hasWild: false,
					direction: "ltr",
					length: 2,
				},
			],
			reel: [
				["s1", "s1", "s2"],
				["s4", "s2", "s2"],
				["s4", "s2", "s3"],
				["s3", "a", "j"],
				["q", "s4", "s1"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "s4",
							payout: 60000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["s4", "s1", "s1"],
						["s3", "s1", "s4"],
						["k", "s4", "s3"],
						["s3", "a", "j"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s4",
						},
						{
							column: 1,
							row: 0,
							symbol: "s3",
						},
						{
							column: 1,
							row: 1,
							symbol: "s1",
						},
						{
							column: 2,
							row: 0,
							symbol: "k",
						},
					],
					win: 120000,
					multiplier: 2,
				},
				{
					winnings: [
						{
							symbol: "s4",
							payout: 60000,
							ways: 1,
							hasWild: true,
							direction: "ltr",
							length: 2,
						},
						{
							symbol: "s1",
							payout: 32000,
							ways: 2,
							hasWild: true,
							direction: "ltr",
							length: 2,
						},
					],
					rng: [
						["s4", "s1", "s1"],
						["s4", "s3", "s1"],
						["wild", "k", "s3"],
						["s3", "a", "j"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s4",
						},
						{
							column: 1,
							row: 0,
							symbol: "s4",
						},
						{
							column: 2,
							row: 0,
							symbol: "wild",
						},
					],
					win: 276000,
					multiplier: 3,
				},
				{
					winnings: [
						{
							symbol: "j",
							payout: 6000,
							ways: 1,
							hasWild: false,
							direction: "ltr",
							length: 3,
						},
					],
					rng: [
						["j", "s4", "s4"],
						["s4", "j", "s3"],
						["j", "k", "s3"],
						["s3", "a", "j"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "j",
						},
						{
							column: 0,
							row: 1,
							symbol: "s4",
						},
						{
							column: 0,
							row: 2,
							symbol: "s4",
						},
						{
							column: 1,
							row: 0,
							symbol: "s4",
						},
						{
							column: 1,
							row: 1,
							symbol: "j",
						},
						{
							column: 2,
							row: 0,
							symbol: "j",
						},
					],
					win: 24000,
					multiplier: 4,
				},
				{
					winnings: [
						{
							symbol: "s3",
							payout: 100000,
							ways: 2,
							hasWild: false,
							direction: "ltr",
							length: 3,
						},
					],
					rng: [
						["s3", "s4", "s4"],
						["s1", "s4", "s3"],
						["s2", "k", "s3"],
						["s3", "s3", "a"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "s3",
						},
						{
							column: 1,
							row: 0,
							symbol: "s1",
						},
						{
							column: 2,
							row: 0,
							symbol: "s2",
						},
						{
							column: 3,
							row: 0,
							symbol: "s3",
						},
					],
					win: 500000,
					multiplier: 5,
				},
				{
					winnings: [],
					rng: [
						["a", "s4", "s4"],
						["k", "s1", "s4"],
						["s1", "s2", "k"],
						["q", "s4", "a"],
						["q", "s4", "s1"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 0,
							row: 0,
							symbol: "a",
						},
						{
							column: 1,
							row: 0,
							symbol: "k",
						},
						{
							column: 2,
							row: 0,
							symbol: "s1",
						},
						{
							column: 3,
							row: 0,
							symbol: "q",
						},
						{
							column: 3,
							row: 1,
							symbol: "s4",
						},
					],
					win: 0,
					multiplier: 6,
				},
			],
		},
		free_spin: {
			count: 2,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 2434000,
		balance: 0,
	},
	success: true,
	request_id: "20d4a098-de2c-42ea-9970-c051008911ac",
};

freeData[9] = {
	data: {
		win: 15000000,
		slot: {
			winnings: [
				{
					symbol: "s1",
					payout: 15000000,
					ways: 2,
					hasWild: false,
					direction: "rtl",
					length: 3,
				},
			],
			reel: [
				["s2", "j", "s3"],
				["s3", "s4", "s1"],
				["j", "s1", "s1"],
				["q", "s1", "s2"],
				["a", "s1", "q"],
			],
			cascaded: [
				{
					winnings: [
						{
							symbol: "s2",
							payout: 35000000,
							ways: 1,
							hasWild: false,
							direction: "rtl",
							length: 2,
						},
					],
					rng: [
						["s2", "j", "s3"],
						["q", "s3", "s4"],
						["s2", "s1", "j"],
						["s3", "q", "s2"],
						["s2", "a", "q"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 1,
							row: 0,
							symbol: "q",
						},
						{
							column: 2,
							row: 0,
							symbol: "s2",
						},
						{
							column: 2,
							row: 1,
							symbol: "s1",
						},
						{
							column: 3,
							row: 0,
							symbol: "s3",
						},
						{
							column: 4,
							row: 0,
							symbol: "s2",
						},
					],
					win: 35000000,
					multiplier: 2,
				},
				{
					winnings: [],
					rng: [
						["s2", "j", "s3"],
						["q", "s3", "s4"],
						["s2", "s1", "j"],
						["s3", "s3", "q"],
						["a", "a", "q"],
					],
					type: "cascade",
					outcome: null,
					cascades: [
						{
							column: 2,
							row: 0,
							symbol: "s2",
						},
						{
							column: 3,
							row: 0,
							symbol: "s3",
						},
						{
							column: 4,
							row: 0,
							symbol: "a",
						},
					],
					win: 0,
					multiplier: 3,
				},
			],
		},
		free_spin: null,
		total_win: 30000000,
		max_win_hit: true,
		balance: 0,
		jackpots: [
			{
				id: 3,
				type: "super",
				win: "0.000000",
			},
		],
	},
	success: true,
	request_id: "d0f214d4-ad4f-48ed-a724-877ebde21848",
};

//no win
freeData[10] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["a", "s1", "s2"],
				["j", "s1", "j"],
				["q", "j", "a"],
				["k", "s4", "s2"],
				["s1", "j", "s2"],
			],
		},
		free_spin: {
			count: 0,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

//no win
freeData[11] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["s1", "j", "s2"],
				["s4", "s1", "s3"],
				["q", "j", "a"],
				["a", "s1", "s2"],
				["k", "s4", "s2"],
			],
		},
		free_spin: {
			count: 0,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

//no win
freeData[12] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["a", "s1", "s2"],
				["k", "s4", "q"],
				["s1", "j", "s2"],
				["s4", "s1", "s3"],
				["q", "j", "a"],
			],
		},
		free_spin: {
			count: 0,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

//no win
freeData[13] = {
	data: {
		win: 0,
		slot: {
			winnings: [],
			reel: [
				["s3", "s1", "s2"],
				["k", "s4", "s2"],
				["s4", "s1", "s3"],
				["s1", "j", "s2"],
				["q", "j", "a"],
			],
		},
		free_spin: {
			count: 0,
			retrigger: false,
			add: null,
			scatterCount: null,
		},
		total_win: 0,
		balance: 0,
	},
	success: true,
	request_id: "0a84699a-18c8-43d7-861d-a8736d7c2068",
};

//---------

buyFreeData[0] = {
	data: {
		total_win: 0,

		win: 0,

		slot: {
			winnings: [],

			reel: [
				["sc", "sc", "sc"],

				["sc", "sc", "sc"],

				["sc", "sc", "sc"],

				["sc", "sc", "sc"],

				["sc", "sc", "sc"],
			],
		},

		balance: 0,

		free_spin: {
			count: 14,

			scatterCount: 5,

			retrigger: false,

			new_multiplier: null,
		},

		jackpot_prizes: {
			title: "Slot Jackpot",

			super: "101100.000000",

			major: "100600.000000",

			mini: "100200.000000",
		},
	},

	success: true,

	request_id: "0c3cc8d8-8edd-4f6a-984e-8551b233ffa1",
};
//load data
loadData[0] = {
	data: {
		player: {
			balance: 0,
			currency: "IDR",
		},
		machine: {
			multiplier: 10,
			machine_id: 1,
			min_bet: "30000.00",
			max_bet: "750000.00",
			bet_sizes: [1000, 2000, 3000, 4000, 5000],
			bet_levels: [1, 2, 3, 4, 5],
			default: {
				bet_size: 1000,
				bet_level: 1,
			},
			free_spin_cost: 10,
		},
		slot: {
			reel: [
				["j", "s4", "s2"],
				["q", "j", "q"],
				["s3", "q", "k"],
				["s1", "q", "k"],
				["s3", "a", "j"],
				["s3", "a", "j"],
			],
		},
		info: {
			type: "ways_to_win",
			ways: 243,
			direction: "ltr",
			wild_appears: [1, 2, 3],
			paytable: {
				j: [0, 0, 3, 5, 25],
				q: [0, 0, 5, 20, 50],
				k: [0, 0, 10, 40, 80],
				a: [0, 0, 20, 60, 120],
				s1: [0, 0, 40, 80, 200],
				s2: [0, 0, 60, 100, 300],
				s3: [0, 0, 80, 200, 600],
				s4: [0, 0, 100, 400, 1000],
				wild: [0, 0, 0, 0, 0],
				sc: [0, 0, 0, 0, 0],
			},
			row: 3,
			col: 5,
			min_scatter: 3,
			max_win_multiplier: 1000,
		},
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "1000.000000",
			major: "500.000000",
			mini: "29.58228000000000",
		},
	},
	success: true,
	request_id: "9dbf55aa-773d-433e-90a6-c529d70174ac",
};

loadData[1] = {
	//free spin not yet played
	data: {
		player: {
			balance: 0,
			currency: "IDR",
		},
		machine: {
			machine_id: 1,
			min_bet: "30000.00",
			max_bet: "750000.00",
			bet_sizes: [1000, 2000, 3000, 4000, 5000],
			bet_levels: [1, 2, 3, 4, 5],
			default: {
				bet_size: 1000,
				bet_level: 1,
			},
			multiplier: 30,
			free_spin_cost: 10,
		},
		slot: {
			reel: [
				["sc", "sc", "sc"],
				["sc", "sc", "sc"],
				["sc", "sc", "sc"],
				["sc", "sc", "sc"],
				["sc", "sc", "sc"],
			],
			winnings: [],
		},
		free_spin: {
			freeSpinWin: 0,
			count: 10,
			scatterCount: 5,
		},
		info: {
			type: "ways_to_win",
			ways: 243,
			direction: "ltr",
			wild_appears: [1, 2, 3],
			paytable: {
				j: [0, 0, 3, 5, 25],
				q: [0, 0, 5, 20, 50],
				k: [0, 0, 10, 40, 80],
				a: [0, 0, 20, 60, 120],
				s1: [0, 0, 40, 80, 200],
				s2: [0, 0, 60, 100, 300],
				s3: [0, 0, 80, 200, 600],
				s4: [0, 0, 100, 400, 1000],
				wild: [0, 0, 0, 0, 0],
				sc: [0, 0, 0, 0, 0],
			},
			row: 3,
			col: 5,
			min_scatter: 3,
			max_win_multiplier: 1000,
		},
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "1000.000000",
			major: "500.000000",
			mini: "29.58228000000000",
		},
	},
	success: true,
	request_id: "9dbf55aa-773d-433e-90a6-c529d70174ac",
};

loadData[2] = {
	data: {
		player: {
			balance: 0,
			currency: "IDR",
		},
		info: {
			type: "ways_to_win",
			ways: 243,
			direction: "ltr",
			wild_appears: [1, 2, 3],
			paytable: {
				j: [0, 0, 3, 5, 25],
				q: [0, 0, 5, 25, 50],
				k: [0, 0, 10, 40, 80],
				a: [0, 0, 20, 60, 150],
				s1: [0, 0, 30, 100, 250],
				s2: [0, 0, 40, 150, 450],
				s3: [0, 0, 50, 250, 650],
				s4: [0, 0, 100, 450, 900],
				wild: [0, 0, 0, 0, 0],
				sc: [0, 0, 0, 0, 0],
			},
			row: 3,
			col: 5,
		},
		machine: {
			machine_id: 1,
			min_bet: "30000.00",
			max_bet: "750000.00",
			bet_sizes: [1000, 2000, 3000, 4000, 5000],
			bet_levels: [1, 2, 3, 4, 5],
			default: {
				bet_size: 1000,
				bet_level: 1,
			},
			multiplier: 30,
			free_spin_cost: 10,
			min_scatter: 3,
			max_win_multiplier: 1000,
		},
		slot: {
			reel: [
				["q", "j", "k"],
				["q", "q", "a"],
				["q", "q", "s3"],
				["s4", "s1", "s3"],
				["s2", "a", "q"],
			],
			winnings: [
				{
					symbol: "q",
					ways: 4,
					payout: 20000,
					has_wild: false,
				},
			],
		},
		free_spin: {
			count: 9,
			freeSpinWin: "20000.000000",
		},
		total_win: 20000,

		info: {
			type: "ways_to_win",
			ways: 243,
			direction: "ltr",
			wild_appears: [1, 2, 3],
			paytable: {
				j: [0, 0, 3, 5, 25],
				q: [0, 0, 5, 20, 50],
				k: [0, 0, 10, 40, 80],
				a: [0, 0, 20, 60, 120],
				s1: [0, 0, 40, 80, 200],
				s2: [0, 0, 60, 100, 300],
				s3: [0, 0, 80, 200, 600],
				s4: [0, 0, 100, 400, 1000],
				wild: [0, 0, 0, 0, 0],
				sc: [0, 0, 0, 0, 0],
			},
			row: 3,
			col: 5,
			min_scatter: 3,
			max_win_multiplier: 1000,
		},
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "1000.000000",
			major: "500.000000",
			mini: "29.58228000000000",
		},
		jackpots: null,
	},
	success: true,
	request_id: "9dbf55aa-773d-433e-90a6-c529d70174ac",
};

//load with jackpot
loadData[3] = {
	data: {
		player: {
			balance: 0,
			currency: "IDR",
		},
		machine: {
			machine_id: 1,
			min_bet: 30000,
			max_bet: 750000,
			bet_sizes: [1000, 2000, 3000, 4000, 5000],
			bet_levels: [1, 2, 3, 4, 5],
			default: {
				bet_size: 1000,
				bet_level: 1,
			},
			multiplier: 30,
			free_spin_cost: 10,
		},
		slot: {
			reel: [
				["k", "s2", "s1"],
				["s4", "s3", "j"],
				["k", "j", "k"],
				["s4", "k", "s1"],
				["k", "q", "a"],
			],
		},
		info: {
			type: "ways_to_win",
			ways: 243,
			direction: "ltr",
			wild_appears: [1, 2, 3],
			paytable: {
				j: [0, 0, 3, 5, 25],
				q: [0, 0, 5, 20, 50],
				k: [0, 0, 10, 40, 80],
				a: [0, 0, 20, 60, 120],
				s1: [0, 0, 40, 80, 200],
				s2: [0, 0, 60, 100, 300],
				s3: [0, 0, 80, 200, 600],
				s4: [0, 0, 100, 400, 1000],
				wild: [0, 0, 0, 0, 0],
				sc: [0, 0, 0, 0, 0],
			},
			row: 3,
			col: 5,
			min_scatter: 3,
			max_win_multiplier: 1000,
		},
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "1000.000000",
			major: "500.000000",
			mini: "29.58228000000000",
		},

		jackpots: [
			{
				id: 24,
				type: "minor",
				win: 10000,
			},
			{
				id: 99,
				type: "major",
				win: 200000,
			},
			{
				id: 87,
				type: "super",
				win: 200000,
			},
		],
	},
	success: true,
	request_id: "9dbf55aa-773d-433e-90a6-c529d70174ac",
};

//cascade load
loadData[4] = {
	data: {
		player: {
			balance: 1020000,
			currency: "IDR",
		},
		machine: {
			machine_id: 1,
			min_bet: 30000,
			max_bet: 750000,
			bet_sizes: [1000, 2000, 3000, 4000, 5000],
			bet_levels: [1, 2, 3, 4, 5],
			default: {
				bet_size: 1000,
				bet_level: 2,
			},
			multiplier: 30,
			free_spin_cost: 10,
		},
		slot: {
			reel: [
				["q", "k", "a"],
				["s1", "j", "q"],
				["q", "j", "q"],
				["j", "sc", "s2"],
				["k", "a", "a"],
			],
		},
		info: {
			effect: "cascading",
			type: "ways_to_win",
			ways: 243,
			direction: "ltr",
			wild_appears: [1, 2, 3],
			paytable: {
				j: [0, 0, 2, 4, 8],
				q: [0, 0, 5, 10, 15],
				k: [0, 0, 10, 15, 20],
				a: [0, 0, 20, 30, 40],
				s1: [0, 0, 30, 50, 70],
				s2: [0, 0, 40, 80, 120],
				s3: [0, 0, 50, 100, 150],
				s4: [0, 0, 100, 200, 300],
				wild: [0, 0, 0, 0, 0],
				sc: [0, 0, 0, 0, 0],
			},
			row: 3,
			col: 5,
			min_scatter: 3,
			max_win_multiplier: 1000,
		},
		jackpot_prizes: {
			title: "Slot Jackpot",
			super: "1000.000000",
			major: "500.000000",
			mini: "100.000000",
		},
	},
	success: true,
	request_id: "414da223-30fe-488d-b10c-3bb877783e9f",
};

//no jackpot prizes
loadData[5] = {
	data: {
		player: {
			balance: 1020000,
			currency: "IDR",
		},
		machine: {
			machine_id: 1,
			min_bet: 30000,
			max_bet: 750000,
			bet_sizes: [1000, 2000, 3000, 4000, 5000],
			bet_levels: [1, 2, 3, 4, 5],
			default: {
				bet_size: 1000,
				bet_level: 2,
			},
			multiplier: 30,
			free_spin_cost: 10,
		},
		slot: {
			reel: [
				["q", "k", "a"],
				["s1", "j", "q"],
				["q", "j", "q"],
				["j", "sc", "s2"],
				["k", "a", "a"],
			],
		},
		info: {
			effect: "cascading",
			type: "ways_to_win",
			ways: 243,
			direction: "ltr",
			wild_appears: [1, 2, 3],
			paytable: {
				j: [0, 0, 2, 4, 8],
				q: [0, 0, 5, 10, 15],
				k: [0, 0, 10, 15, 20],
				a: [0, 0, 20, 30, 40],
				s1: [0, 0, 30, 50, 70],
				s2: [0, 0, 40, 80, 120],
				s3: [0, 0, 50, 100, 150],
				s4: [0, 0, 100, 200, 300],
				wild: [0, 0, 0, 0, 0],
				sc: [0, 0, 0, 0, 0],
			},
			row: 3,
			col: 5,
			min_scatter: 3,
			max_win_multiplier: 1000,
		},
		jackpot_prizes: null,
	},
	success: true,
	request_id: "414da223-30fe-488d-b10c-3bb877783e9f",
};
