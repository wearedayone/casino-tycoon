import { createUserIfNotExist } from '../services/user.service.js';

export const getMe = async (req, res) => {
  try {
    await createUserIfNotExist(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    return res.status(400).send(err);
  }
};
