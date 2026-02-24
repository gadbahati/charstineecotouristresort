export default function logout(req, res) {
  // Destroy the admin session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
}