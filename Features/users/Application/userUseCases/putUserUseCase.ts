import { HttpErrors } from "../../../../Core/dberrors.js";
import type { User } from "../../Domain/Data/user.js";
import type { UserRepository } from "../../Domain/Repository/userRepository.js";

interface PutUsersUseCaseDeps {
    usersRepository: UserRepository;
}

export class PutUsersUseCase {
    private readonly usersRepository: UserRepository;

    constructor({ usersRepository }: PutUsersUseCaseDeps) {
        this.usersRepository = usersRepository;
    }

    async execute(id: number, userData: Partial<User>): Promise<any> {
        if (!userData || Object.keys(userData).length === 0) {
            throw HttpErrors.badRequest('At least one field is required to update the user');
        }

        return this.usersRepository.putUsers(id, userData as User);
    }
}
