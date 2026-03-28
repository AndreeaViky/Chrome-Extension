console.log("Numbers.js is running");

function textToNumber(text) {
  const t = text.toLowerCase().trim();

  // If it's already a numeric string
  const direct = parseInt(t);
  if (!isNaN(direct)) return direct;

  const ones = {
    'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,
    'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,
    'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,
    'nineteen':19
  };
  const tens = {
    'twenty':20,'thirty':30,'forty':40,'fifty':50,
    'sixty':60,'seventy':70,'eighty':80,'ninety':90
  };

  // Direct match in ones
  if (ones[t] !== undefined) return ones[t];

  // Direct match in tens
  if (tens[t] !== undefined) return tens[t];

  // Compound: "twenty one", "twenty-one"
  const parts = t.replace('-', ' ').split(' ');
  if (parts.length === 2 && tens[parts[0]] !== undefined && ones[parts[1]] !== undefined) {
    return tens[parts[0]] + ones[parts[1]];
  }

  // "one hundred"
  if (t === 'one hundred' || t === 'hundred') return 100;

  return -1; // Not recognized
}