"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealJourneyByToken = exports.getJourneyById = exports.createJourney = void 0;
const server_1 = require("../server");
/**
 * Creates a new journey with the provided title
 * A journey serves as a container for multiple stops that tell a story
 */
const createJourney = async (req, res) => {
    try {
        const { title } = req.body;
        // Validate required title field
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        // Create the journey with default unpaid status
        const journey = await server_1.prisma.journey.create({
            data: {
                title,
            },
        });
        // Return basic journey information
        res.status(201).json({
            id: journey.id,
            title: journey.title,
        });
    }
    catch (error) {
        console.error('Error creating journey:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createJourney = createJourney;
/**
 * Retrieves a journey by ID with all associated stops
 * Conditionally includes shareable token if journey is paid
 */
const getJourneyById = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch journey with all stops ordered by position
        const journey = await server_1.prisma.journey.findUnique({
            where: { id },
            include: {
                stops: {
                    orderBy: {
                        order: 'asc' // Ensure stops are returned in correct sequence
                    }
                }
            }
        });
        if (!journey) {
            return res.status(404).json({ error: 'Journey not found' });
        }
        // Build response object with proper typing
        const response = {
            id: journey.id,
            title: journey.title,
            paid: journey.paid,
            stops: journey.stops.map(stop => ({
                id: stop.id,
                title: stop.title,
                note: stop.note,
                image_url: stop.image_url,
                order: stop.order
            }))
        };
        // Only include shareable token for paid journeys
        // This prevents unauthorized access to unpaid content
        if (journey.paid && journey.shareableToken) {
            response.shareableToken = journey.shareableToken;
        }
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching journey:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getJourneyById = getJourneyById;
/**
 * Reveals a journey using a secure shareable token
 * Only works for paid journeys - provides secure access to paid content
 */
const revealJourneyByToken = async (req, res) => {
    try {
        const { shareableToken } = req.params;
        // Find journey by shareable token with all associated stops
        const journey = await server_1.prisma.journey.findUnique({
            where: { shareableToken },
            include: {
                stops: {
                    orderBy: {
                        order: 'asc' // Ensure stops are returned in correct sequence
                    }
                }
            }
        });
        // Return 404 if journey not found OR if journey is not paid
        // This maintains security by not revealing unpaid content
        if (!journey || !journey.paid) {
            return res.status(404).json({ error: 'Journey not found' });
        }
        // Return full journey data for paid journeys
        const response = {
            id: journey.id,
            title: journey.title,
            paid: journey.paid,
            stops: journey.stops.map(stop => ({
                id: stop.id,
                title: stop.title,
                note: stop.note,
                image_url: stop.image_url,
                order: stop.order
            }))
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error revealing journey:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.revealJourneyByToken = revealJourneyByToken;
