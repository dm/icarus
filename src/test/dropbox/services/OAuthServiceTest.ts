import { expect } from 'chai';
import 'mocha';
import { mock, instance, when, verify, resetCalls, anyString,  anything } from 'ts-mockito';

import { OAuthService } from "../../../main/dropbox/services/OAuthService";
import { TokenRepository } from "../../../main/dropbox/repositories/TokenRepository";
import { CursorRepository } from "../../../main/dropbox/repositories/CursorRepository";
import { IdentityService } from "../../../main/common/services/IdentityService"
import { DropboxClient } from "../../../main/dropbox/clients/DropboxClient";
import { DropboxIdentity } from "../../../main/common/Api"
import { DropboxAccessDetails } from "../../../main/dropbox/Api"

const tokenRepositoryMock = mock(TokenRepository)
const tokenRepository = instance(tokenRepositoryMock)

const cursorRepositoryMock = mock(CursorRepository)
const cursorRepository = instance(cursorRepositoryMock)

const identityServiceMock = mock(IdentityService)
const identityService = instance(identityServiceMock)

const dropboxClientMock = mock(DropboxClient)
const dropboxClient = instance(dropboxClientMock)

const unit = new OAuthService(identityService, dropboxClient, tokenRepository, cursorRepository)

when(tokenRepositoryMock.saveToken(anyString(), anyString())).thenReturn(Promise.resolve())
when(cursorRepositoryMock.saveCursor(anyString(), anyString())).thenReturn(Promise.resolve())
when(identityServiceMock.addIdentity(anyString(), 'dropbox', anything() )).thenReturn(Promise.resolve(
  {
    accessToken: '',
    userName: '',
    dropboxAccountId: 'dropbox-account-id',
    githubUsername: undefined,
  }
))

const dropboxAccessDetails:DropboxAccessDetails = {
  accountId: 'dropbox-account-id',
  accessToken: 'dropbox-access-token'
}
when(dropboxClientMock.requestToken(anyString(), anyString())).thenReturn(Promise.resolve(dropboxAccessDetails))
when(dropboxClientMock.getLatestCursor(anyString(), anyString())).thenReturn(Promise.resolve('the-cursor'))


beforeEach(() => {
  resetCalls(tokenRepositoryMock)
  resetCalls(identityServiceMock)
  resetCalls(dropboxClientMock)
  resetCalls(cursorRepositoryMock)
})

describe('Dropbox OAuth Service', () => {
  describe('Process Auth Code', async () => {
    it('should exchange Access Code for Access Token', async () => {
      const result = await unit.processCode('icarus-access-token', 'dropbox-auth-code', 'http://return.uri')
      verify(dropboxClientMock.requestToken('dropbox-auth-code', 'http://return.uri')).once()
    })

    it('should save the token in Token Repository', async () => {
      const result = await unit.processCode('icarus-access-token', 'dropbox-auth-code', 'http://return.uri')
      verify(tokenRepositoryMock.saveToken('dropbox-account-id', 'dropbox-access-token')).once()
    })

    it('should retrieve and store the latest cursor', async () => {
      const result = await unit.processCode('icarus-access-token', 'dropbox-auth-code', 'http://return.uri')
      verify(dropboxClientMock.getLatestCursor('dropbox-account-id', 'dropbox-access-token')).once()
      verify(cursorRepositoryMock.saveCursor('dropbox-account-id', 'the-cursor')).once()
    })

    it('should add a new Identity to Identity Service', async () => {
      const result = await unit.processCode('icarus-access-token', 'dropbox-access-token', 'http://return.uri')
      verify(identityServiceMock.addIdentity('icarus-access-token', 'dropbox', anything() )).once()
    })

    it('should return the Icarus access token containing the Dropbox account id', async () => {
      const result = await unit.processCode('icarus-access-token', 'dropbox-auth-code', 'http://return.uri')
      expect(result.dropboxAccountId).is.equal('dropbox-account-id')
    })
  })
})