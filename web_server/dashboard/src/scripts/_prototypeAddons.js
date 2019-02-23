String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

Date.prototype.concise = function() {
    const pad = num => num.toString().padStart(2, "0");
    return `${this.getFullYear()}-${pad(this.getMonth())}-${pad(this.getDate())} ${pad(this.getHours())}:${pad(this.getMinutes())}:${pad(
        this.getSeconds()
    )}`;
};
