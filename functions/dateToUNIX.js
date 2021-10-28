function dateToUNIX(dateString) {
  return new Date(dateString).getTime() / 1000;
}

module.exports = dateToUNIX;
