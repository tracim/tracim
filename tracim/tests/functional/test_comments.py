# -*- coding: utf-8 -*-
from tracim.tests import FunctionalTest
from tracim.fixtures.content import Content as ContentFixtures
from tracim.fixtures.users_and_groups import Base as BaseFixture


class TestCommentsEndpoint(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/contents/{content_id}/comments
    endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_contents_comments__ok_200__nominal_case(self) -> None:
        """
        Get alls comments of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/2/contents/7/comments', status=200)   # nopep8
        assert len(res.json_body) == 3
        comment = res.json_body[0]
        assert comment['content_id'] == 18
        assert comment['parent_id'] == 7
        assert comment['raw_content'] == '<p> What is for you the best cake ever ? </br> I personnally vote for Chocolate cupcake !</p>'  # nopep8
        assert comment['author']
        assert comment['author']['user_id'] == 1
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment['author']['avatar_url'] == None
        assert comment['author']['public_name'] == 'Global manager'

        comment = res.json_body[1]
        assert comment['content_id'] == 19
        assert comment['parent_id'] == 7
        assert comment['raw_content'] == '<p>What about Apple Pie ? There are Awesome !</p>'  # nopep8
        assert comment['author']
        assert comment['author']['user_id'] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment['author']['avatar_url'] == None
        assert comment['author']['public_name'] == 'Bob i.'

        comment = res.json_body[2]
        assert comment['content_id'] == 20
        assert comment['parent_id'] == 7
        assert comment['raw_content'] == '<p>You are right, but Kouign-amann are clearly better.</p>'  # nopep8
        assert comment['author']
        assert comment['author']['user_id'] == 1
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment['author']['avatar_url'] == None
        assert comment['author']['public_name'] == 'Global manager'

    def test_api__post_content_comment__ok_200__nominal_case(self) -> None:
        """
        Get alls comments of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        params = {
            'raw_content': 'I strongly disagree, Tiramisu win !'
        }
        res = self.testapp.post_json(
            '/api/v2/workspaces/2/contents/7/comments',
            params=params,
            status=200
        )
        comment = res.json_body
        assert comment['content_id']
        assert comment['parent_id'] == 7
        assert comment['raw_content'] == 'I strongly disagree, Tiramisu win !'
        assert comment['author']
        assert comment['author']['user_id'] == 1
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment['author']['avatar_url'] is None
        assert comment['author']['public_name'] == 'Global manager'

        res = self.testapp.get('/api/v2/workspaces/2/contents/7/comments', status=200)  # nopep8
        assert len(res.json_body) == 4
        assert comment == res.json_body[3]

    def test_api__delete_content_comment__ok_200__nominal_case(self) -> None:
        """
        Get alls comments of a content
        """
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/workspaces/2/contents/7/comments', status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[2]
        assert comment['content_id'] == 20
        assert comment['parent_id'] == 7
        assert comment['raw_content'] == '<p>You are right, but Kouign-amann are clearly better.</p>'   # nopep8
        assert comment['author']
        assert comment['author']['user_id'] == 1
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment['author']['avatar_url'] is None
        assert comment['author']['public_name'] == 'Global manager'

        res = self.testapp.delete(
            '/api/v2/workspaces/2/contents/7/comments/20',
            status=204
        )
        res = self.testapp.get('/api/v2/workspaces/2/contents/7/comments', status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content['content_id'] == 20]  # nopep8
