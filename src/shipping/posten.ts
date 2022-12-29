import { PostenInvalidQueryError, PostenNotFoundError } from "../errors/posten";

class Posten {
  trackUrl: string;

  constructor() {
    this.trackUrl = "https://sporing.posten.no/tracking/api/fetch";
  }

  track(id: string) {
    const url = new URL(this.trackUrl);
    url.searchParams.append("query", id);
    url.searchParams.append("lang", "no");

    return fetch(url.href)
      .then((resp) => resp.json())
      .then((response) => {
        if (response?.errorCode && response?.errorCode === "2404") {
          throw new PostenNotFoundError(response);
        }

        if (
          response?.consignmentSet?.[0]?.error &&
          response?.consignmentSet?.[0]?.error?.code === 400
        ) {
          throw new PostenInvalidQueryError(response);
        }

        return response;
      })
      .then((response) => Posten.transformPostenResponse(response));
  }

  static transformPostenResponse(response: object) {
    const l = response?.consignmentSet?.[0];
    // delete l.packageSet
    return {
      weight: l.totalWeightInKgs,
      name: l.packageSet?.[0].productName,
      events: l.packageSet?.[0].eventSet?.map((event) => {
        return {
          description: event.description,
          city: event.city,
          country: event.country,
          countryCode: event.countryCode,
          date: event.dateIso,
          status: Posten.formatEventStatus(event.status),
        };
      }),
    };
  }

  static formatEventStatus(status: string) {
    const s = status.toLowerCase()?.replaceAll("_", " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export default Posten;
