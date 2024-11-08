import { GraphQLError } from 'graphql';

export function maxPageValidation(pageSize): number {
  if (pageSize > 25) {
    throw new GraphQLError(`max page size can't be more than 25`);
  } else if (pageSize < 10) {
    throw new GraphQLError(`page size can't be less than 10`);
  }

  return pageSize;
}

export function setPage(page, pageSize): number {
  return page * pageSize;
}
