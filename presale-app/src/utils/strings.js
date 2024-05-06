import { toast } from 'sonner';

export const copyToClipboard = (value) => {
  navigator.clipboard.writeText(value);
  toast.success('Copied to clipboard');
};

export const stripWalletAddress = (address) => `${(address ?? '')?.substring(0, 10)}...`;
