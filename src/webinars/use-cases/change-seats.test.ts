import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { ChangeSeats } from './change-seats';
import { Webinar } from '../entities/webinar.entity';
import { testUser } from '../../users/tests/user-seeds';
import { WebinarNotFoundException } from '../exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from '../exceptions/webinar-not-organizer';
import { WebinarReduceSeatsException } from '../exceptions/webinar-reduce-seats';
import { WebinarTooManySeatsException } from '../exceptions/webinar-too-many-seats';

describe('Feature: Change seats', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar title',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-01T01:00:00Z'),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }

  describe('Scenario: Happy path', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };

    it('should change the number of seats for a webinar', async () => {
      await useCase.execute(payload);

      const updatedWebinar = await webinarRepository.findById('webinar-id');
      expect(updatedWebinar?.props.seats).toEqual(200);
    });
  });

  describe('Scenario: Webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'non-existent-id',
      seats: 200,
    };

    it('should throw an error', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(
        WebinarNotFoundException,
      );
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: User is not the organizer', () => {
    const payload = {
      user: testUser.bob,
      webinarId: 'webinar-id',
      seats: 200,
    };

    it('should throw an error', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(
        WebinarNotOrganizerException,
      );
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: Reducing the number of seats', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 50,
    };

    it('should throw an error', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(
        WebinarReduceSeatsException,
      );
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: Changing seats to more than 1000', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 1001,
    };

    it('should throw an error', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(
        WebinarTooManySeatsException,
      );
      expectWebinarToRemainUnchanged();
    });
  });
});