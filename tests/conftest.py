import pytest

@pytest.fixture(autouse=True)
def setup(fn_isolation):
    """
    Isolation ensures that each test runs with a fresh blockchain.
    """
    pass