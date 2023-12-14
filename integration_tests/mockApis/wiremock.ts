import superagent, { SuperAgentRequest, Response } from 'superagent'

const url = 'http://127.0.0.1:9091/__admin'

const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${url}/mappings`).send(mapping)

const getMatchingRequests = body => superagent.post(`${url}/requests/find`).send(body)

const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${url}/mappings`), superagent.delete(`${url}/requests`)])

const verifyRequest = ({
  requestUrl,
  requestUrlPattern,
  method,
  body,
  queryParameters,
}: {
  requestUrl?: string
  requestUrlPattern?: string
  method: string
  body?: unknown
  queryParameters?: unknown
}): Promise<number> => {
  const bodyPatterns =
    (body && {
      bodyPatterns: [{ equalToJson: JSON.stringify(body) }],
    }) ||
    {}
  return superagent
    .post(`${url}/requests/count`)
    .send({
      method,
      urlPattern: requestUrlPattern,
      url: requestUrl,
      ...bodyPatterns,
      queryParameters,
    })
    .then(response => parseInt(JSON.parse(response.text).count, 10))
}

export { stubFor, getMatchingRequests, resetStubs, verifyRequest }
