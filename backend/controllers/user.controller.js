import { createUserIfNotExist, toggleWarStatus } from '../services/user.service.js';

export const getMe = async (req, res) => {
  try {
    await createUserIfNotExist(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const toggleWar = async (req, res) => {
  try {
    await toggleWarStatus(req.userId, req.body.war);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};
