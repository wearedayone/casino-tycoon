import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  const snapshot = await firestore.collectionGroup('warResult').get();

  for (const item of snapshot.docs) {
    const { defendResults } = item.data();

    if (!defendResults?.length) continue;

    const newDefendResults = defendResults.map((result) => {
      if (result.result !== 'win') return { ...result, machineLost: 0 };

      const { attackUnits } = result;
      if (!attackUnits) return { ...result, machineLost: 0 };
      return { ...result, machineLost: Math.max(Math.floor(attackUnits * 0.1), 1) };
    });

    console.log(newDefendResults);
    await item.ref.update({ defendResults: newDefendResults });
  }
};

main();
