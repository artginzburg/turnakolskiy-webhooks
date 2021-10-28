function yesterday() {
  return ((d) => {
    d.setDate(d.getDate() - 1);
    return d;
  })(new Date());
}

module.exports = yesterday;
