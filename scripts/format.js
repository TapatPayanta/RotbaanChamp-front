//price/mileage format//
export const fmtPrice = n => Number(n).toLocaleString("th-TH") + " THB";
export const fmtKm = n =>
    (n === null || n === undefined || n === "" || isNaN(n))
        ? "-"
        : Number(n).toLocaleString("th-TH") + " km";  