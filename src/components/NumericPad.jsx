
export default function NumericPad ({ onKeyPress }) {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '⌫', '0'
  ];

  return (
    <div style={{
      width: '90%',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px'
    }}>
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onKeyPress(key)}
          style={{
            fontSize: '1rem',
            padding: '30px',
            backgroundColor: '#f0f0f0',
            border: '4px solid #856594',
            borderRadius: '10px',
            color: '#856594',
            fontWeight: 'bold'
          }}
        >
          {key}
        </button>
      ))}
    </div>
  );
};
