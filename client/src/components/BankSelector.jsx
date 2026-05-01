const banks = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Punjab National Bank"];

export default function BankSelector({ value, onChange }) {
  return (
    <div className="bank-grid">
      {banks.map((bank) => (
        <button
          key={bank}
          type="button"
          onClick={() => onChange(bank)}
          className={value === bank ? "bank-card selected" : "bank-card"}
        >
          <span>{bank}</span>
        </button>
      ))}
    </div>
  );
}
