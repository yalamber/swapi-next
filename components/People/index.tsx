function People({ people }: any) {
  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 shadow rounded-lg">
      <h2 className="mt-4 font-bold text-xl">{people.name}</h2>
      <h6 className="mt-2 text-sm font-medium">{people.gender}</h6>
    </div>
  );
}

export default People;
