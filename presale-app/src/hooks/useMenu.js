import { useState } from 'react';

const useMenu = () => {
  const [open, setOpen] = useState(false);

  return { open, setOpen };
};

export default useMenu;
