import { initTransaction, validateTxnHash } from '../services/transaction.service.js';

export const create = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const result = await initTransaction(data);
    return res.status(200).send(result);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
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
