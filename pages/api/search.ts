import type { NextApiRequest, NextApiResponse } from 'next';

const apiBaseUrl: string = process.env.API_URL!;

async function searchRequest(path: string, query: string) {
  const response = await fetch(`${apiBaseUrl}/${path}/?search=${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

async function getPeopleFromResponse(data: any) {
  const peopleReqPromises: Array<any> = [];
  data.forEach((people: string) => {
    peopleReqPromises.push(fetch(people));
  });
  if (peopleReqPromises.length > 0) {
    const peopleRes = await Promise.all(peopleReqPromises);
    const peopleDataPromises: Array<any> = [];
    peopleRes.forEach((res: any) => {
      peopleDataPromises.push(res.json());
    });
    const peopleData = await Promise.all(peopleDataPromises);
    return peopleData;
  }
  return [];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).end('Query string required.');
  }
  const resources = [
    'films',
    'people',
    'planets',
    'species',
    'starships',
    'vehicles',
  ];
  switch (req.method) {
    case 'GET':
      {
        const reqPromises: Array<any> = [];
        resources.forEach((resource) => {
          reqPromises.push(searchRequest(resource, query));
        });
        // fire all queries
        const [
          filmsResponse,
          peopleResponse,
          planetsResponse,
          speciesResponse,
          starshipsResponse,
          vehiclesResponse,
        ] = await Promise.all(reqPromises);
        // get all data
        const [
          filmData,
          peopleData,
          planetsData,
          speciesData,
          starshipsData,
          vehiclesData,
        ] = await Promise.all([
          filmsResponse.json(),
          peopleResponse.json(),
          planetsResponse.json(),
          speciesResponse.json(),
          starshipsResponse.json(),
          vehiclesResponse.json(),
        ]);
        // check all types for results
        const results = [];
        if (filmData.count > 0) {
          for (const film of filmData.results) {
            const peoples = await getPeopleFromResponse(film.characters);
            results.push({
              objectType: 'Film',
              title: film.title,
              peoples,
            });
          }
        }
        if (peopleData.count > 0) {
          results.push({
            objectType: 'People',
            peoples: peopleData.results,
          });
        }
        if (planetsData.count > 0) {
          for (const planet of planetsData.results) {
            const peoples = await getPeopleFromResponse(planet.residents);
            results.push({
              objectType: 'Film',
              title: planet.name,
              peoples,
            });
          }
        }
        if (speciesData.count > 0) {
          for (const species of speciesData.results) {
            const peoples = await getPeopleFromResponse(species.people);
            results.push({
              objectType: 'Film',
              title: species.name,
              peoples,
            });
          }
        }
        if (starshipsData.count > 0) {
          for (const starship of planetsData.results) {
            const peoples = await getPeopleFromResponse(starship.pilots);
            results.push({
              objectType: 'Starships',
              title: starship.name,
              peoples,
            });
          }
        }
        if (vehiclesData.count > 0) {
          for (const vehicle of vehiclesData.results) {
            const peoples = await getPeopleFromResponse(vehicle.residents);
            results.push({
              objectType: 'Vehicle',
              title: vehicle.name,
              peoples,
            });
          }
        }
        res.status(200).json(results);
      }
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
