from api import app
from models import db
from youtube import fetchMetadata

videoExample = 'pzBi1nwDn8U'

with app.app_context():
    db.drop_all()
    db.create_all()
    client = app.test_client()

#Metadata Test
    print('fetchMetadata:')
    metadata = fetchMetadata(videoExample)
    print(metadata)

#Users Tests
    print('\n POST /api/users/ :')
    resp = client.post('/api/users/', json={'email': 'johndoe@xyz.com'})
    print(resp.status_code, resp.get_json())
    user_id = resp.get_json()[0]['userID']

    print('\n GET /api/users/ :')
    resp = client.get('/api/users/')
    print(resp.status_code, resp.get_json())

    print('\n GET /api/users/<userID> :')
    resp = client.get(f'/api/users/{user_id}')
    print(resp.status_code, resp.get_json())

    print('\n PATCH /api/users/<userID> :')
    resp = client.patch(f'/api/users/{user_id}', json={'email': 'johndoeNEW@xyz.com'})
    print(resp.status_code, resp.get_json())

#Videos Tests
    print('\n POST /api/videos/<videoID> :')
    resp = client.post(f'/api/videos/{videoExample}')
    print(resp.status_code, resp.get_json())

    print('\n GET /api/videos/<videoID> :')
    resp = client.get(f'/api/videos/{videoExample}')
    print(resp.status_code, resp.get_json())

    print('\n GET /api/videos :')
    resp = client.get('/api/videos')
    print(resp.status_code, resp.get_json())

#Ratings Tests
    print('\n POST /api/ratings :')
    resp = client.post('/api/ratings', json={
        'userID': user_id,
        'videoID': videoExample,
        'overallRating': 5,
        'feedback': 'Great captions!',
        'thumbsUp': True,
        'videoTimestamp': 42
    })
    print(resp.status_code, resp.get_json())
    rating_id = resp.get_json()['ratingID']

    print('\n GET /api/ratings :')
    resp = client.get('/api/ratings')
    print(resp.status_code, resp.get_json())

    print('\n GET /api/ratings/<ratingID> :')
    resp = client.get(f'/api/ratings/{rating_id}')
    print(resp.status_code, resp.get_json())

    print('\n PATCH /api/ratings/<ratingID> :')
    resp = client.patch(f'/api/ratings/{rating_id}', json={
        'userID': user_id,
        'videoID': videoExample,
        'overallRating': 4,
        'feedback': 'Updated feedback',
        'thumbsUp': False,
        'videoTimestamp': 43
    })
    print(resp.status_code, resp.get_json())

    print('\n DELETE /api/ratings/<ratingID> :')
    resp = client.delete(f'/api/ratings/{rating_id}')
    print(resp.status_code, resp.get_json())

    print('\n DELETE /api/videos/<videoID> :')
    resp = client.delete(f'/api/videos/{videoExample}')
    print(resp.status_code, resp.get_json())

    print('\n DELETE /api/users/<userID> :')
    resp = client.delete(f'/api/users/{user_id}')
    print(resp.status_code, resp.get_json())

