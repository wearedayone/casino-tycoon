import {
  initTransaction,
  validateTxnHash,
  claimToken as claimTokenService,
  finishClaimToken,
} from '../services/transaction.service.js';

export const create = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const result = await initTransaction(data);
    return res.status(200).send(result);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err.message);
  }
};

export const validate = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    await validateTxnHash(data);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const claimToken = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const { address, claimedAmount, transactionId } = await claimTokenService(data);
    finishClaimToken({ address, claimedAmount, transactionId });
    return res.status(200).send({ claimedAmount });
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
};
