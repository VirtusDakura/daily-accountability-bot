/**
 * Daily Motivational Quotes for Programmers
 * One quote is picked per day based on the date
 */

export const quotes = [
    "The only way to learn a new programming language is by writing programs in it. — Dennis Ritchie",
    "First, solve the problem. Then, write the code. — John Johnson",
    "Code is like humor. When you have to explain it, it's bad. — Cory House",
    "Make it work, make it right, make it fast. — Kent Beck",
    "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler",
    "The best error message is the one that never shows up. — Thomas Fuchs",
    "Programming isn't about what you know; it's about what you can figure out. — Chris Pine",
    "The most disastrous thing that you can ever learn is your first programming language. — Alan Kay",
    "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code. — Dan Salomon",
    "Simplicity is the soul of efficiency. — Austin Freeman",
    "Before software can be reusable it first has to be usable. — Ralph Johnson",
    "Java is to JavaScript what car is to carpet. — Chris Heilmann",
    "Walking on water and developing software from a specification are easy if both are frozen. — Edward V. Berard",
    "It's not a bug – it's an undocumented feature. — Anonymous",
    "In order to understand recursion, one must first understand recursion. — Anonymous",
    "Talk is cheap. Show me the code. — Linus Torvalds",
    "Programs must be written for people to read, and only incidentally for machines to execute. — Harold Abelson",
    "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live. — John Woods",
    "Give a man a program, frustrate him for a day. Teach a man to program, frustrate him for a lifetime. — Muhammad Waseem",
    "A language that doesn't affect the way you think about programming is not worth knowing. — Alan Perlis",
    "The computer was born to solve problems that did not exist before. — Bill Gates",
    "Measuring programming progress by lines of code is like measuring aircraft building progress by weight. — Bill Gates",
    "Everybody should learn to program a computer, because it teaches you how to think. — Steve Jobs",
    "One of my most productive days was throwing away 1,000 lines of code. — Ken Thompson",
    "The function of good software is to make the complex appear to be simple. — Grady Booch",
    "Don't worry if it doesn't work right. If everything did, you'd be out of a job. — Mosher's Law",
    "Programming is thinking, not typing. — Casey Patton",
    "The best programmers are not marginally better than merely good ones. They are an order-of-magnitude better. — Randall E. Stross",
    "Experience is the name everyone gives to their mistakes. — Oscar Wilde",
    "Learning to write programs stretches your mind and helps you think better. — Bill Gates",
    "The only way to go fast, is to go well. — Robert C. Martin"
];

/**
 * Get quote of the day based on current date
 * Same quote for the entire day
 * @returns {string} Today's motivational quote
 */
export function getQuoteOfTheDay() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % quotes.length;
    return quotes[quoteIndex];
}

/**
 * Get a random quote
 * @returns {string} Random motivational quote
 */
export function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}
