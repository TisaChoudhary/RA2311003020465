export const Log = async (stack, level, pkg, message) => {
  try {
    const response = await fetch('http://20.207.122.201/evaluation-service/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <token>'
      },
      body: JSON.stringify({
        stack,
        level,
        package: pkg,
        message
      })
    });
    
    if (!response.ok) {
      console.error('Failed to log:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending log:', error);
  }
};
