import pulumi
import pulumi_aws as aws

# Create a VPC
vpc = aws.ec2.Vpc("my-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": "my-vpc",
    })

# Create an Internet Gateway
internet_gateway = aws.ec2.InternetGateway("my-igw",
    vpc_id=vpc.id,
    tags={
        "Name": "my-igw",
    })

# Create a Public Subnet
public_subnet = aws.ec2.Subnet("public-subnet",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone="ap-southeast-1a",  # Change this to your desired AZ
    map_public_ip_on_launch=True,
    tags={
        "Name": "public-subnet",
    })

# Create a Route Table
route_table = aws.ec2.RouteTable("public-rt",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=internet_gateway.id,
        ),
    ],
    tags={
        "Name": "public-rt",
    })

# Associate the Route Table with the Public Subnet
route_table_association = aws.ec2.RouteTableAssociation("public-rta",
    subnet_id=public_subnet.id,
    route_table_id=route_table.id)

# Create a Security Group
security_group = aws.ec2.SecurityGroup("web-sg",
    description="Allow inbound HTTP and SSH traffic",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            cidr_blocks=["0.0.0.0/0"],  # For better security, replace with your IP
        )
    ],
    egress=[aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        cidr_blocks=["0.0.0.0/0"],
    )],
    tags={
        "Name": "web-sg",
    })

# Create a key pair
key_pair = aws.ec2.KeyPair("my-key-pair",
    public_key="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDuXwFAfiNb2wHcffLKnaouDcn+wksQrJSeb5uAildqN5CyN1nz7hrIbPcK3++XQxMLXJ7Hg9Ynb0P5krSBjwsK9ng2Odl3QvTBkM2nVS8OtKh3InGzqNZmucyXxiLRK9jcR+VZNQZELYZmJ5ZsfxVqWOMk6EdL0p+ffEkLiHb7KfRFg5PrrhlVY9FhyMyM1vxvAisH6RC/yE7wjhku8cptkOyw2WF82dNKJsx2JOA+oDXRqqxZY5hQXwQl4kESLh2kpyCEg5XAt5qvX5oJU1bDrgAYmeotvvTCDfmI0bAOFL1/tj1saTr3dA4pbhnGszMH3SF5lh5fE1K1K2PVOX7p codespace@codespaces-a4c1aa")  # Replace with your public key

# Function to create EC2 instances
def create_ec2_instance(name, az):
    return aws.ec2.Instance(name,
        instance_type="t3.small",
        ami="ami-01938df366ac2d954",  # Change with your ami ID
        subnet_id=public_subnet.id,
        associate_public_ip_address=True,
        vpc_security_group_ids=[security_group.id],
        availability_zone=az,
        key_name=key_pair.key_name,
        tags={
            "Name": name,
        })

# Create two EC2 instances
instance1 = create_ec2_instance("instance-1", "ap-southeast-1a")
instance2 = create_ec2_instance("instance-2", "ap-southeast-1a")

# Export the VPC ID and EC2 instance public IPs
pulumi.export("vpc_id", vpc.id)
pulumi.export("instance1_public_ip", instance1.public_ip)
pulumi.export("instance2_public_ip", instance2.public_ip)