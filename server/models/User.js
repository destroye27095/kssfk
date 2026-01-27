/**
 * KSFP User Model
 * Represents a user with multiple authentication methods
 * Maps to one internal user ID
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class User {
    constructor() {
        this.storePath = path.join(__dirname, '../../data/users.json');
    }

    /**
     * Create User
     */
    async create(userData) {
        try {
            const users = await this.loadUsers();

            const user = {
                id: this.generateId(),
                full_name: userData.full_name || '',
                email: userData.email || null,
                phone_number: userData.phone_number || null,
                google_id: userData.google_id || null,
                facebook_id: userData.facebook_id || null,
                role: userData.role || 'parent',
                status: userData.status || 'active',
                created_at: new Date().toISOString(),
                last_login: null,
                verified_at: null,
                profile_completed: false,
                two_factor_enabled: false
            };

            users[user.id] = user;
            await this.saveUsers(users);

            return user;
        } catch (error) {
            console.error('User creation error:', error);
            throw error;
        }
    }

    /**
     * Find User by ID
     */
    async findById(userId) {
        try {
            const users = await this.loadUsers();
            return users[userId] || null;
        } catch (error) {
            console.error('Find user error:', error);
            return null;
        }
    }

    /**
     * Find User by Email
     */
    async findByEmail(email) {
        try {
            const users = await this.loadUsers();
            for (const user of Object.values(users)) {
                if (user.email === email) {
                    return user;
                }
            }
            return null;
        } catch (error) {
            console.error('Find by email error:', error);
            return null;
        }
    }

    /**
     * Find User by Phone Number
     */
    async findByPhoneNumber(phoneNumber) {
        try {
            const users = await this.loadUsers();
            for (const user of Object.values(users)) {
                if (user.phone_number === phoneNumber) {
                    return user;
                }
            }
            return null;
        } catch (error) {
            console.error('Find by phone error:', error);
            return null;
        }
    }

    /**
     * Find User by Google ID
     */
    async findByGoogleId(googleId) {
        try {
            const users = await this.loadUsers();
            for (const user of Object.values(users)) {
                if (user.google_id === googleId) {
                    return user;
                }
            }
            return null;
        } catch (error) {
            console.error('Find by Google ID error:', error);
            return null;
        }
    }

    /**
     * Find User by Facebook ID
     */
    async findByFacebookId(facebookId) {
        try {
            const users = await this.loadUsers();
            for (const user of Object.values(users)) {
                if (user.facebook_id === facebookId) {
                    return user;
                }
            }
            return null;
        } catch (error) {
            console.error('Find by Facebook ID error:', error);
            return null;
        }
    }

    /**
     * Update User
     */
    async update(userId, updates) {
        try {
            const users = await this.loadUsers();
            const user = users[userId];

            if (!user) {
                throw new Error('User not found');
            }

            // Only allow updating specific fields
            const allowedFields = [
                'full_name',
                'email',
                'phone_number',
                'google_id',
                'facebook_id',
                'status',
                'last_login',
                'verified_at',
                'profile_completed',
                'two_factor_enabled'
            ];

            for (const field of allowedFields) {
                if (field in updates) {
                    user[field] = updates[field];
                }
            }

            user.updated_at = new Date().toISOString();
            users[userId] = user;
            await this.saveUsers(users);

            return user;
        } catch (error) {
            console.error('User update error:', error);
            throw error;
        }
    }

    /**
     * Delete User
     */
    async delete(userId) {
        try {
            const users = await this.loadUsers();
            delete users[userId];
            await this.saveUsers(users);
            return true;
        } catch (error) {
            console.error('User deletion error:', error);
            throw error;
        }
    }

    /**
     * Get All Users (with pagination)
     */
    async getAll(page = 1, limit = 50) {
        try {
            const users = await this.loadUsers();
            const userArray = Object.values(users);
            const total = userArray.length;
            const pages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            const end = start + limit;

            return {
                users: userArray.slice(start, end),
                pagination: {
                    current: page,
                    total: pages,
                    limit: limit,
                    count: end - start,
                    total_count: total
                }
            };
        } catch (error) {
            console.error('Get all users error:', error);
            return { users: [], pagination: {} };
        }
    }

    /**
     * Get User Count
     */
    async getCount(role = null) {
        try {
            const users = await this.loadUsers();
            let count = Object.values(users).length;

            if (role) {
                count = Object.values(users).filter(u => u.role === role).length;
            }

            return count;
        } catch (error) {
            console.error('Count users error:', error);
            return 0;
        }
    }

    /**
     * Update Last Login
     */
    async updateLastLogin(userId) {
        try {
            await this.update(userId, {
                last_login: new Date().toISOString()
            });
        } catch (error) {
            console.error('Update last login error:', error);
        }
    }

    /**
     * Check User Exists
     */
    async exists(userId) {
        try {
            const user = await this.findById(userId);
            return !!user;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get Users by Role
     */
    async getByRole(role) {
        try {
            const users = await this.loadUsers();
            return Object.values(users).filter(u => u.role === role);
        } catch (error) {
            console.error('Get by role error:', error);
            return [];
        }
    }

    /**
     * Search Users
     */
    async search(query) {
        try {
            const users = await this.loadUsers();
            const lowerQuery = query.toLowerCase();

            return Object.values(users).filter(user =>
                user.full_name.toLowerCase().includes(lowerQuery) ||
                user.email?.toLowerCase().includes(lowerQuery) ||
                user.phone_number?.includes(query)
            );
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Load Users from Storage
     */
    async loadUsers() {
        try {
            const data = await fs.readFile(this.storePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
            return {};
        }
    }

    /**
     * Save Users to Storage
     */
    async saveUsers(users) {
        try {
            const dir = path.dirname(this.storePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.storePath, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('Save users error:', error);
            throw error;
        }
    }

    /**
     * Generate Unique User ID
     */
    generateId() {
        return 'usr_' + crypto.randomBytes(12).toString('hex');
    }

    /**
     * Get User Summary (for API responses)
     */
    getSummary(user) {
        return {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            role: user.role,
            status: user.status,
            verified_at: user.verified_at,
            created_at: user.created_at,
            last_login: user.last_login
        };
    }
}

module.exports = new User();
