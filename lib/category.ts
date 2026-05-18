export const getCategory = (remarks: string) => {

  const text = remarks.toLowerCase();

  if (
    text.includes("swiggy") ||
    text.includes("zomato")
  ) {
    return "Food";
  }

  if (
    text.includes("uber")
  ) {
    return "Travel";
  }

  if (
    text.includes("spotify")
  ) {
    return "Entertainment";
  }

  return "Others";
};