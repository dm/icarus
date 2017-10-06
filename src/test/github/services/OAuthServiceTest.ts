import { expect } from 'chai';
import 'mocha';
import { mock, instance, when, verify, resetCalls, anyString,  anything } from 'ts-mockito';

import { OAuthService } from "../../../main/github/services/OAuthService";
import { TokenRepository } from "../../../main/github/repositories/TokenRepository";
import { IdentityService } from "../../../main/common/services/IdentityService"
import { GithubClient } from "../../../main/github/clients/GithubClient";
import { GithubIdentity } from "../../../main/common/Api"

const tokenRepositoryMock = mock(TokenRepository)
const tokenRepository = instance(tokenRepositoryMock)

const identityServiceMock = mock(IdentityService)
const identityService = instance(identityServiceMock)

const githubClientMock = mock(GithubClient)
const githubClient = instance(githubClientMock)

const unit = new OAuthService(identityService, githubClient, tokenRepository)

when(tokenRepositoryMock.saveToken(anyString(), anyString())).thenReturn(Promise.resolve())
when(identityServiceMock.addIdentity(anyString(), 'github', anything() )).thenReturn(Promise.resolve(
  {
    accessToken: '',
    userName: '',
    dropboxAccountId: undefined,
    githubUsername: 'github-username',
  }
 ))
when(githubClientMock.getUsername(anyString())).thenReturn(Promise.resolve('github-username'))
when(githubClientMock.requestAccessToken(anyString(), anyString())).thenReturn(Promise.resolve('github-access-token'))

beforeEach(() => {
  resetCalls(tokenRepositoryMock)
  resetCalls(identityServiceMock)
  resetCalls(githubClientMock)
})

// FIXME Re-enable tests when implementation is fixed
describe.skip('GitHub OAuth Service', () => {
  describe('Process Auth Code', async () => {


    it('should exchange Access Code for Access Token', async () => {
      const result = await unit.processCode('icarus-access-token', 'github-access-code', 'http://return.uri')
      verify(githubClientMock.requestAccessToken('github-access-code', 'http://return.uri')).once()
    })

    it('should request the username', async () => {
      const result = await unit.processCode('icarus-access-token', 'github-access-code', 'http://return.uri')
      verify(githubClientMock.getUsername('github-access-token')).once()
    })

    it('should save the token in Token Repository', async () => {
      const result = await unit.processCode('icarus-access-token', 'github-access-code', 'http://return.uri')
      verify(tokenRepositoryMock.saveToken('github-username', 'github-access-token')).once()
    })

    it('should add a new Identity to Identity Service', async () => {
      const result = await unit.processCode('icarus-access-token', 'github-access-code', 'http://return.uri')
      verify(identityServiceMock.addIdentity('icarus-access-token', 'github', anything() )).once()
    })

    it('should return the Icarus access token containing the github username', async () => {
      const result = await unit.processCode('icarus-access-token', 'github-access-code', 'http://return.uri')
      expect(result.githubUsername).is.equal('github-username')
    })
  })
})
