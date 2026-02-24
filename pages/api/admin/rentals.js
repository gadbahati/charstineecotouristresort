import nc from 'next-connect';
import { verifyToken } from '../../../utils/auth';

const handler = nc()
  // Middleware to verify the JWT token
  .use(verifyToken)
  
  // Protected GET endpoint to fetch rental data
  .get(async (req, res) => {
    // Fetch rental data logic here
    res.status(200).json({ message: 'GET rentals data' });
  })

  // Protected POST endpoint to create a new rental
  .post(async (req, res) => {
    // Create rental logic here
    res.status(201).json({ message: 'Rental created', data: req.body });
  });

export default handler;
