const Input = ({ sx, ...rest }) => {
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        border: '1px solid #555',
        borderRadius: 16,
        padding: '8px 16px',
        outline: 'none',
        ...sx,
      }}
    />
  );
};

export default Input;
