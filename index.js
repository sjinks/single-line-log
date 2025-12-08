const stringWidth = require('string-width').default;

const MOVE_UP = '\u001b[1A';        // Move cursor up one line
const CLEAR_LINE = '\u001b[0K';     // Clear line from cursor to end
const CLEAR_CURRENT = '\r' + CLEAR_LINE;

const isAppleTerminal = process.env.TERM_PROGRAM === 'Apple_Terminal';

/**
 * Creates a logger that overwrites previous output.
 *
 * @param {import('tty').WriteStream} stream The output stream (stdout or stderr)
 */
module.exports = function(stream) {
	if (!stream || typeof stream.write !== 'function') {
		throw new TypeError('Expected a writable stream');
	}

	const write = stream.write;
	/** @var {string|null} */
	let str;

	stream.write = function(data) {
		if (str && data !== str) {
			str = null;
		}

		return write.apply(this, arguments);
	};

	if (stream === process.stderr || stream === process.stdout) {
		process.on('exit', function() {
			if (str !== null) {
				stream.write('');
			}
		});
	}

	let prevLineCount = 0;

	/**
	 * Log function that overwrites previous output.
	 *
	 * @param {...unknown[]} args Arguments to log
	 */
	const log = function(...args) {
		str = '';
		const nextStr = args.join(' ');

		if (stream.isTTY) {
			// Clear screen
			for (let i = 0; i < prevLineCount; ++i) {
				str += CLEAR_CURRENT + (i < prevLineCount - 1 ? MOVE_UP : '');
			}
		}

		str += nextStr;
		stream.write(str);

		if (stream.isTTY && stream.columns) {
			const prevLines = nextStr.split('\n');
			const { columns } = stream;
			prevLineCount = 0;
			let i = prevLines.length;
			while (i--) {
				const lineWidth = stringWidth(prevLines[i]);
				prevLineCount += Math.max(1, Math.ceil(lineWidth / columns));
			}
		} else {
			prevLineCount = nextStr.split('\n').length;
		}
	};

	log.clear = function() {
		stream.write(isAppleTerminal ? '\n' : '');
	};

	return log;
};

module.exports.stdout = module.exports(process.stdout);
module.exports.stderr = module.exports(process.stderr);
