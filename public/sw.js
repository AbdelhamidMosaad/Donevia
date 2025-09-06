
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const taskData = event.notification.data;

  if (event.action === 'mark-as-done' && taskData && taskData.taskId) {
    // This is a simplified approach. In a real app, you'd use the Fetch API
    // to make a secure, authenticated request to your backend or a Firebase Cloud Function
    // to update the task in Firestore. Directly using the Firebase SDK in a service worker
    // can be complex regarding authentication.
    // For this prototype, we'll log the action to the console.
    console.log(`Task ${taskData.taskId} marked as done from notification.`);
    
    // Example of what a fetch to a Cloud Function might look like:
    /*
    const promiseChain = fetch(`/api/markTaskAsDone?taskId=${taskData.taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'd need a way to pass auth tokens to the service worker securely
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      console.log('Task updated successfully via API.');
    });

    event.waitUntil(promiseChain);
    */
  } else if (taskData && taskData.listId) {
     // When the notification body is clicked (and it's not an action button)
     event.waitUntil(
        clients.openWindow(`/dashboard/lists/${taskData.listId}`)
     );
  }
});
