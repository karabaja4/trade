const figlet = require('figlet');

const escapes = {
  white: '\x1b[97m',
  gray: '\x1b[90m',
  green: '\x1b[92m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  cursor: {
    show: '\x1b[?25h',
    hide: '\x1b[?25l',
    moveTopLeft: '\x1b[H',
  },
};

process.on('SIGINT', () => {
  console.log('exited');
  process.stdout.write(escapes.cursor.show); // show cursor
  process.exit();
});

const block = '█';

let lock = false;

const insert = (text, ins, index) => {
  return `${text.substring(0, index)}${ins}${text.substring(index, text.length)}`;
};

const print = async (data, symbols) => {
  if (!lock) {
    lock = true;
    const keys = [];
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      if (data[symbol]) {
        keys.push(symbol); // counting symbols in data, do not show if not all are there
      }
    }
    if (keys.length == symbols.length) { // got all
      const rows = ['', '', '', ''];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = data[key];
        const name = `${key.split(':')[1]}:`.padEnd(10);
        const decimalLength = getDecimalLength(value.price);
        const price = `${padFloat(value.price, decimalLength)} USD`.padEnd(12);
        const change = `${value.change < 0 ? '' : (value.change > 0 ? '+' : ' ')}${padFloat(value.change, decimalLength)} USD`;
        let text = await figlet.text(`  ${name} ${price}  |  ${change}  `, { font: '3x5', width: 1000 });
        text = text.replace(/#/g, block);
        // colorize
        const lines = text.split('\n');
        const color = value.change >= 0 ? escapes.green : escapes.red;
        for (let j = 0; j < lines.length; j++) {
          let line = lines[j];
          if (line.includes(block)) {
            line = insert(line, `${escapes.white}`, 8);
            line = insert(line, `${escapes.reset}${escapes.gray}`, 114);
            line = insert(line, `${escapes.reset}${color}`, 134);
            line = `${line.substring(0, 196).padEnd(196)}${escapes.reset}`;
          } else {
            line = '';
          }
          rows.push(line);
        }
      }
      output(rows);
    } else {
      switchToLogMode();
      console.log(`Loading symbols (${keys.length}/${symbols.length})`);
    }
    lock = false;
  }
};

const getDecimalLength = (num) => {
  if (num === undefined) {
    return 2;
  }
  const length = Math.floor(num).toString().length;
  const decimals = 5 - length;
  return decimals < 2 ? 2 : decimals;
};

const padFloat = (num, len) => {
  return num.toLocaleString("en", {
    useGrouping: false,
    minimumFractionDigits: len,
    maximumFractionDigits: len
  });
}

let cleared = false;

const output = (rows) => {
  switchToDrawMode();
  process.stdout.write(escapes.cursor.moveTopLeft); // move to top left
  console.log(rows.join('\n'));
};

const switchToDrawMode = () => {
  if (!cleared) {
    cleared = true;
    process.stdout.write(escapes.cursor.hide);
    console.clear();
  }
};

const switchToLogMode = () => {
  if (cleared) {
    cleared = false;
    process.stdout.write(escapes.cursor.show);
    console.clear();
  }
};

module.exports = {
  print,
  switchToLogMode,
};
